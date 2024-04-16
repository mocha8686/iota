const degrees = 60;
const transitionDuration = 250;
const holdDuration = 1000;
const delayFunction = (x: number, y: number): number => (6 - (5 * x + y)) / 6;

const boxSize = 16 * 4;
const boxColor = 'black';
const boxBorderColor = '#444';
const boxAnimationSpacing = 500;
const boxRotation = 60;

const radians = (degrees * Math.PI) / 180;

const phi = (alpha: number, beta: number): number =>
	Math.abs(alpha * Math.cos(radians)) + Math.abs(beta * Math.sin(radians));
const numBoxes = (distance: number): number => Math.ceil(distance / boxSize);

let oldWidth = 0,
	oldHeight = 0;

export function grid(): Promise<void> | undefined {
	if (!window || !document) return;

	if (window.innerWidth !== oldWidth || window.innerHeight !== oldHeight) {
		resizeGrid();
	}

	const duration = 2 * transitionDuration + holdDuration;
	const offset = transitionDuration / duration;

	const hidden = {
		rotate: `1 -1 0 ${boxRotation}deg`,
		opacity: 0,
	};
	const visible = {
		rotate: '1 -1 0 0deg',
		opacity: 1,
	};

	const keyframes = [hidden, { ...visible, offset }, { ...visible, offset: 1 - offset }, hidden];

	for (const element of document.getElementsByClassName('grid-transition-box')) {
		const box = element as HTMLDivElement;
		const boxDelay = Number(box.dataset.delay) ?? 0;

		const animation = box.animate(keyframes, {
			duration,
			delay: boxAnimationSpacing * boxDelay,
			easing: 'linear',
			fill: 'both',
		});
		animation.play();
	}

	return new Promise((resolve) => setTimeout(resolve, (duration + boxAnimationSpacing) / 2));
}

function resizeGrid() {
	if (!document.getElementById('grid-transition-grid')) {
		const grid = document.createElement('div');
		grid.id = 'grid-transition-grid';
		grid.style.pointerEvents = 'none';
		grid.style.position = 'absolute';
		grid.style.top = '50%';
		grid.style.left = '50%';
		grid.style.translate = '-50% -50%';
		grid.style.display = 'grid';
		grid.style.rotate = `${degrees}deg`;
		document.body.appendChild(grid);
	}

	const grid = document.getElementById('grid-transition-grid')!;
	for (const elem of grid.children) {
		grid.removeChild(elem);
	}

	const distanceX = phi(window.innerWidth, window.innerHeight);
	const distanceY = phi(window.innerHeight, window.innerWidth);
	const numX = numBoxes(distanceX);
	const numY = numBoxes(distanceY);

	grid.style.gridTemplateColumns = `repeat(${numX}, min-content)`;
	grid.style.gridTemplateRows = `repeat(${numY}, min-content)`;

	for (let i = 0; i < numX * numY; i++) {
		const box = document.createElement('div');
		box.className = 'grid-transition-box';
		box.style.aspectRatio = '1';
		box.style.opacity = '0';
		box.style.backgroundColor = boxColor;
		box.style.border = `1px solid ${boxBorderColor}`;
		box.style.width = `${boxSize}px`;
		grid.appendChild(box);
	}

	for (const element of grid.children) {
		const box = element as HTMLDivElement;
		const boundingRect = box.getBoundingClientRect();
		const x = boundingRect.x / window.innerWidth;
		const y = boundingRect.y / window.innerHeight;
		const boxDelay = delayFunction(x, y);
		box.dataset.delay = boxDelay.toString();
	}
}
