<script lang="ts">
	const DEGREES = 120;
	const BOX_SIZE = 16 * 4;
	const TIME = 1000;
	const DELAY = 2000;

	const RADIANS = (DEGREES * Math.PI) / 180;

	const phi = (alpha: number, beta: number): number =>
		Math.abs(alpha * Math.cos(RADIANS)) + Math.abs(beta * Math.sin(RADIANS));
	const numBoxes = (distance: number): number => Math.ceil(distance / BOX_SIZE);

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	let distanceX = $derived(phi(innerWidth, innerHeight));
	let distanceY = $derived(phi(innerHeight, innerWidth));

	let numX = $derived(numBoxes(distanceX));
	let numY = $derived(numBoxes(distanceY));

	function delayFunction(x: number, y: number): number {
		const nX = x / innerWidth;
		const nY = y / innerHeight;
		return (-5 * nX - nY) / 6;
	}

	$effect(() => {
		for (const element of document.getElementsByClassName('box')) {
			const box = element as HTMLDivElement;
			const boundingRect = box.getBoundingClientRect();
			const x = boundingRect.x;
			const y = boundingRect.y;
			const boxDelay = delayFunction(x, y);
			box.style.animationDelay = `${DELAY + TIME * boxDelay}ms`;
		}
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div
	class="grid"
	style:rotate={`${DEGREES}deg`}
	style:grid-template-columns={`repeat(${numX}, min-content)`}
	style:grid-template-rows={`repeat(${numY}, min-content)`}
>
	{#each Array(numX * numY) as _}
		<div class="box" style:width={`${BOX_SIZE}px`} />
	{/each}
</div>

<style lang="scss">
	.grid {
		position: absolute;
		top: 50%;
		left: 50%;
		translate: -50% -50%;

		display: grid;
	}

	.box {
		aspect-ratio: 1;
		background-color: black;
		animation: rotateout 200ms linear forwards;
		border: 1px solid #444;
	}

	@keyframes rotateout {
		to {
			rotate: 1 -1 0 90deg;
			opacity: 0;
		}
	}
</style>
