import Swup from "https://unpkg.com/swup@4?module";

const CELL_SIZE_REM = 4;
const ANGLE_DEG = 20;

const angleRad = (ANGLE_DEG * Math.PI) / 180;

const swup = new Swup();

swup.hooks.replace("animation:out:await", async () => {
	resizeGrid();
});

swup.hooks.replace("animation:in:await", async () => {
	resizeGrid();
});

let needResize = true;
window.addEventListener("resize", () => (needResize = true));

function resizeGrid() {
	if (!needResize) return;
	needResize = false;

	const cellSizePx = getCellSizePx();
	const [width, height] = calculateGridSize(cellSizePx);

	const grid = document.getElementById("grid");
	grid.textContent = "";
	grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
	grid.style.rotate = `-${ANGLE_DEG}deg`;
	grid.style.width = `${width * CELL_SIZE_REM}rem`;
	grid.style.height = `${height * CELL_SIZE_REM}rem`;

	const [gridCenterX, gridCenterY] = [width * cellSizePx / 2, height*cellSizePx / 2];
	const [screenCenterX, screenCenterY] = [window.innerWidth / 2, window.innerHeight / 2];
	const [x, y] = [screenCenterX - gridCenterX, screenCenterY - gridCenterY];
	grid.style.translate = `${x}px ${y}px`;

	for (let i = 0; i < width * height; i++) {
		const cell = createCell();
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

function createCell() {
	const cell = document.createElement("div");
	cell.className = "grid__cell";
	return cell;
}

resizeGrid();
