<script lang="ts">
	import { page } from "$app/stores";

	const { data } = $props();
	const createUrl = (providerId: string) =>
		`/api/login/${providerId}?redirect=${$page.url.pathname}&link=${data.id}`;
</script>

<ul>
	{#each data.providers as { id, name, disabled }}
		<li>
			<a href={createUrl(id)} class:disabled>Link with {name}</a>
		</li>
	{/each}
</ul>

<style lang="scss">
	.disabled {
		pointer-events: none;
		color: gray;
		text-decoration: none;
	}
</style>
