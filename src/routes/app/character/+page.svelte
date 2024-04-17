<script lang="ts">
import { Control, Field, FieldErrors, Label } from 'formsnap';
import { superForm } from 'sveltekit-superforms';
import { zodClient } from 'sveltekit-superforms/adapters';
import { CreateCharacter } from './schema';

const { data } = $props();

const createForm = superForm(data.createForm, {
	validators: zodClient(CreateCharacter),
});
const {
	form: createFormData,
	message: createMessage,
	enhance: createEnhance,
} = createForm;

const deleteForm = superForm(data.deleteForm);
const { message: deleteMessage, enhance: deleteEnhance } = deleteForm;
</script>

<h1>Character</h1>

{#if $createMessage}
	<h2>{$createMessage}</h2>
{/if}

{#if $deleteMessage}
	<h2>{$deleteMessage}</h2>
{/if}

{#if data.characters}
	<form method="POST" action="?/delete" use:deleteEnhance>
		<ul>
			{#each data.characters as character}
				<li>
					{character.name}
					<button name="id" value={character.id}>Delete character</button>
				</li>
			{/each}
		</ul>
	</form>
{/if}

<form method="POST" action="?/create" use:createEnhance>
	<Field form={createForm} name="name">
		<Control let:attrs>
			<Label>Name</Label>
			<input {...attrs} type="text" bind:value={$createFormData.name} />
		</Control>
		<FieldErrors />
	</Field>
	<button>Create new character</button>
</form>

<style lang="scss">
	.invalid {
		color: red;
	}
</style>
