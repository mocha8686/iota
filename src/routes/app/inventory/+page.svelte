<script lang="ts">
	import { getItemById } from '$lib/items';

	const { data } = $props();
</script>

<h1>Inventory</h1>
{#if data?.items && data.items.length > 0}
	<ul>
		{#each data.items as item}
			<li>{getItemById(item.id)?.name} x{item.quantity}</li>
		{/each}
	</ul>
{:else}
	<p>Empty</p>
{/if}
