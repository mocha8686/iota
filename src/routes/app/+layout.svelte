<script lang="ts">
	import { grid } from '$lib/gridTransition';

	const { data } = $props();

	let disabled = $state(false);
	$effect(() => {
		console.log({ disabled });
	});
</script>

<nav class:disabled>
	<a href="/app">Home</a>
	<a href="/app/inventory">Inventory</a>
	<a href="/api/logout">Logout</a>
</nav>


{#key data.pathname}
	<main
		out:grid={{ callback: () => (disabled = true) }}
		in:grid={{ callback: () => (disabled = false) }}
	>
		<slot />
	</main>
{/key}

<style lang="scss">
	.disabled {
		pointer-events: none;
	}
</style>
