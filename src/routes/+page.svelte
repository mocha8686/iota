<script lang="ts">
	// biome-ignore lint/style/useConst: Bound
	let thing = $state("cheese");
</script>

<h1>Stinky {thing}</h1>
<input type="text" bind:value={thing} />

<a href="/app">Go to app</a>
