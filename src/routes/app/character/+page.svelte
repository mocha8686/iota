<script lang="ts">
	const { data, form } = $props();
</script>

<h1>Character</h1>

{#if form?.error}
	<p>Error: {form.error}</p>
{/if}

{#if data.character}
	<p>Name: {data.character.name}</p>
	<form method="POST" action="?/delete">
		<button>Delete character</button>
	</form>
{:else}
	<form method="POST" action="?/create">
		<label
			>Name
			<input name="name" type="text" min="1" value={form?.name ?? ''} />
		</label>
		<button>Create new character</button>
	</form>
{/if}
