const DEGREES = 60;
const BOX_SIZE = 16 * 4;
const RADIANS = (DEGREES * Math.PI) / 180;
const BOX_COLOR = 'black';
const BORDER_COLOR = '#444';

export interface GridParams {
	duration?: number;
	screenTime?: number;
	callback?: () => void;
	boxAnimationDuration?: number;
}

function debounce(func: () => void, wait: number, throttle?: boolean): () => void {
	let timeout: ReturnType<typeof setTimeout> | null;
	return () => {
		timeout && clearTimeout(timeout);
		if (throttle && !timeout) func();
		timeout = setTimeout(function () {
			timeout = null;
			if (!throttle) func();
		}, wait);
	};
}

const phi = (alpha: number, beta: number): number =>
	Math.abs(alpha * Math.cos(RADIANS)) + Math.abs(beta * Math.sin(RADIANS));
const numBoxes = (distance: number): number => Math.ceil(distance / BOX_SIZE);

let eventListenerAttached = false;

export function grid(
	node: HTMLElement,
	params: GridParams | undefined,
	options: { direction: 'in' | 'out' | 'both' },
) {
	if (options.direction === 'both') throw new Error('split transition: into out: and in:');
	const duration = params?.duration ?? 500;
	const screenTime = params?.screenTime ?? 500;
	const boxAnimationDuration = params?.boxAnimationDuration ?? 200;

	if (!eventListenerAttached) {
		eventListenerAttached = true;
		resizeGrid();
		window.addEventListener('resize', debounce(resizeGrid, 250));
	}

	function delayFunction(x: number, y: number): number {
		return (6 - (5 * x + y)) / 6;
	}

	for (const element of document.getElementsByClassName('grid-transition-box')) {
		const box = element as HTMLDivElement;
		const boundingRect = box.getBoundingClientRect();
		const x = boundingRect.x / window.innerWidth;
		const y = boundingRect.y / window.innerHeight;
		const boxDelay = delayFunction(x, y);

		const hidden = {
			rotate: '1 -1 0 90deg',
			opacity: 0,
		};

		const visible = {
			rotate: '1 -1 0 0deg',
			opacity: 1,
		};

		const keyframes = options.direction === 'in' ? [visible, hidden] : [hidden, visible];

		setTimeout(
			() => {
				node.style.visibility = 'visible';
				const animation = box.animate(keyframes, {
					duration: boxAnimationDuration,
					delay: duration * boxDelay,
					easing: 'linear',
					fill: 'both',
				});
				if (options.direction === 'in') {
					animation.addEventListener('finish', () => params?.callback?.());
				} else {
					params?.callback?.();
				}
				animation.play();
			},
			options.direction === 'in' ? screenTime + duration : 0,
		);
	}

	if (options.direction === 'in') {
		node.style.visibility = 'hidden';
		return {
			delay: screenTime + duration + boxAnimationDuration,
			duration: duration,
		};
	} else {
		return {
			delay: 0,
			duration: duration + boxAnimationDuration,
		};
	}
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
		grid.style.rotate = `${DEGREES}deg`;
		document.body.appendChild(grid);
	}

	const distanceX = phi(window.innerWidth, window.innerHeight);
	const distanceY = phi(window.innerHeight, window.innerWidth);
	const numX = numBoxes(distanceX);
	const numY = numBoxes(distanceY);

	const grid = document.getElementById('grid-transition-grid')!;
	for (const elem of grid.children) {
		grid.removeChild(elem);
	}

	grid.style.gridTemplateColumns = `repeat(${numX}, min-content)`;
	grid.style.gridTemplateRows = `repeat(${numY}, min-content)`;

	for (let i = 0; i < numX * numY; i++) {
		const box = document.createElement('div');
		box.className = 'grid-transition-box';
		box.style.aspectRatio = '1';
		box.style.opacity = '0';
		box.style.backgroundColor = BOX_COLOR;
		box.style.border = `1px solid ${BORDER_COLOR}`;
		box.style.width = `${BOX_SIZE}px`;
		grid.appendChild(box);
	}
}
