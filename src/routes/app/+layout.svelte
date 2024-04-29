<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { grid } from '$lib/transition';

	const { data, children } = $props();

	let disabled = $state(false);

	onNavigate(async ({ from, to }) => {
		console.log({ from, to });
		if (from && to && from.url.toString() === to.url.toString()) return;
		disabled = true;
		await grid();
		return () => {
			disabled = false;
		};
	});
</script>

<header>
	<nav class:disabled>
		<a href="/app">Home</a>
		<a href="/app/character">Character</a>
		<a href="/app/scavenge">Scavenge</a>
		<a href="/app/inventory">Inventory</a>
		<a href="/api/logout">Logout</a>
	</nav>
	<div class="user">
		<p>{data.username}</p>
		{#if data.avatar}
			<img class="avatar" src={data.avatar} alt="User avatar">
		{/if}
	</div>
</header>

{#key data.pathname}
	<main>
		{@render children()}
	</main>
{/key}

<style lang="scss">
	header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	nav {
		display: flex;
		flex-direction: row;
		gap: 0.5em;
	}

	.user {
		display: flex;
		flex-direction: row;
		gap: .5em;
	}

	.avatar {
		aspect-ratio: 1;
		width: 4em;
		border-radius: 100%;
	}

	.disabled {
		pointer-events: none;
	}
</style>
