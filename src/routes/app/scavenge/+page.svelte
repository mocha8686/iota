<script lang="ts">
	import { getItemById, getItems } from '$lib/items';

	const { form } = $props();

	const items = getItems();

	function getItemName(itemId: number, quantity: number): string {
		const item = getItemById(itemId)!;
		if (quantity === 1) {
			return item.name.toLowerCase();
		} else {
			return item.plural.toLowerCase();
		}
	}
</script>

<h1>Scavenge</h1>

{#if form?.error}
	<p>Error: {form.error}</p>
{/if}

{#if form?.success}
	<p>
		Scavenged {form.quantity}
		{getItemName(form.itemId, form.quantity)}
	</p>
{/if}

<form method="POST">
	<label>
		Item
		<select name="item-id">
			{#each items as item}
				<option selected={form?.itemId === item.id} value={item.id}>{item.name}</option>
			{/each}
		</select>
	</label>
	<label>
		Quantity
		<input name="quantity" type="number" min="1" value={form?.quantity ?? 1} />
	</label>
	<button type="submit">Submit</button>
</form>
