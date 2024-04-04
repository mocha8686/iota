<script lang="ts">
	let thing = $state('cheese');
</script>

<h1>Stinky {thing}</h1>
<input type="text" bind:value={thing} />

<a href="/api/login">Login</a>
<a href="/app">Go to app</a>
