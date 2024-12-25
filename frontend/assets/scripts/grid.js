import Swup from "https://unpkg.com/swup@4?module";
import anime from '/assets/lib/anime.es.js';

const CELL_SIZE_REM = 4;
const ANGLE_DEG = 20;

const angleRad = (ANGLE_DEG * Math.PI) / 180;

const swup = new Swup();

let rows = 0, columns = 0;

swup.hooks.replace("animation:out:await", async () => {
	resizeGrid();
	document.body.style.pointerEvents = 'none';
	const animation = anime({
		targets: '.grid__cell',
		rotateX: 0,
		rotateY: 0,
		rotateZ: 0,
		duration: 200,
		easing: 'linear',
		delay: anime.stagger(50, {grid: [rows, columns], from: 'first'}),
	});
	await animation.finished;
});

swup.hooks.replace("animation:in:await", async () => {
	resizeGrid(true);
	document.body.style.pointerEvents = 'auto';
	const animation = anime({
		targets: '.grid__cell',
		rotateX: 90,
		rotateY: 45,
		rotateZ: -45,
		duration: 200,
		easing: 'linear',
		delay: anime.stagger(50, {grid: [rows, columns], from: 'first'}),
	});
	await animation.finished;
});

let needResize = true;
window.addEventListener("resize", () => (needResize = true));

function resizeGrid(visible = false) {
	if (!needResize) return;
	needResize = false;

	const cellSizePx = getCellSizePx();
	[rows, columns] = calculateGridSize(cellSizePx);

	const grid = document.getElementById("grid");
	grid.textContent = "";
	grid.style.gridTemplateColumns = `repeat(${rows}, 1fr)`;
	grid.style.rotate = `-${ANGLE_DEG}deg`;
	grid.style.width = `${rows * CELL_SIZE_REM}rem`;
	grid.style.height = `${columns * CELL_SIZE_REM}rem`;

	const [gridCenterX, gridCenterY] = [rows * cellSizePx / 2, columns*cellSizePx / 2];
	const [screenCenterX, screenCenterY] = [window.innerWidth / 2, window.innerHeight / 2];
	const [x, y] = [screenCenterX - gridCenterX, screenCenterY - gridCenterY];
	grid.style.translate = `${x}px ${y}px`;

	for (let i = 0; i < rows * columns; i++) {
		const cell = createCell(visible);
		grid.appendChild(cell);
	}
}

/**
 * @param {number} cellSizePx
 * @returns {[number, number]}
 * @see {@link https://www.desmos.com/calculator/67rnjbghf4|Desmos visualization}
 * @see {@link https://math.stackexchange.com/a/847485|Math StackExchange answer}
 */
function calculateGridSize(cellSizePx) {
	const w = window.innerWidth;
	const h = window.innerHeight;

	const m = angleRad % Math.PI;

	let alpha;
	if (m < Math.PI / 2) {
		alpha = m;
	} else {
		alpha = Math.PI - m;
	}

	const l = Math.sqrt(w * w + h * h);
	const phi = Math.asin(w / l);
	const a = l * Math.sin(alpha + phi);
	const b = l * Math.cos(alpha - phi);

	const resW = Math.ceil(a / cellSizePx);
	const resH = Math.ceil(b / cellSizePx);
	return [resW, resH];
}

function getCellSizePx() {
	const cell = createCell();
	document.body.appendChild(cell);
	const width = cell.clientWidth;
	document.body.removeChild(cell);

	return width;
}

function createCell(visible = false) {
	const cell = document.createElement("div");
	cell.className = "grid__cell";
	if (!visible) {
		cell.style.transform = 'rotateX(90deg) rotateY(45deg) rotateZ(-45deg)';
	}
	return cell;
}

resizeGrid();
