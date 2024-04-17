<script lang="ts">
import items from '$lib/items.json';

const { data } = $props();
</script>

<h1>Inventory</h1>
{#if data?.items && data.items.length > 0}
	<ul>
		{#each data.items as item}
			<li>{items[item.id].name} x{item.count}</li>
		{/each}
	</ul>
{:else}
	<p>Empty</p>
{/if}
