<script lang="ts">
	import locations from '$lib/locations.json';

	const { data, form } = $props();
</script>

<h1>{locations[data.id].name}</h1>

{#if form?.message}
	<h2>{form.message}</h2>
{/if}

{#if form?.type === 'encounter'}
	<h2>Encounter {form.enemies!.map(enemy => `#${enemy.id} x${enemy.count}`).join(' ')}</h2>
{:else if form?.type === 'item'}
	<h2>Item {form.item} x{form.count}</h2>
{/if}

<form method="POST">
	<button>Roll</button>
</form>
