<script lang="ts">
	import { getItemById, getItems } from '$lib/items';

	const { form } = $props();

	const items = getItems();
</script>

<h1>Scavenge</h1>

{#if form?.error}
	<p>Error: {form.error}</p>
{/if}

{#if form?.success}
	<p>Scavenged {form.quantity} {getItemById(form.itemId)?.name}{form.quantity !== 1 && 's'}</p>
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
