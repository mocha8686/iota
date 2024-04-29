<script lang="ts">
	const { data } = $props();
	const createUrl = (providerId: string) =>
		`/api/login/${providerId}${data.redirect ? `?redirect=${data.redirect}` : ""}`;
</script>

{#each data.providers as { id, name }}
	<a href={createUrl(id)}>Login with {name}</a>
{/each}
