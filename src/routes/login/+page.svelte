<script lang="ts">
	const { data } = $props();
	const createUrl = (provider: string) =>
		`/api/login/${provider}${data.redirect ? `?redirect=${data.redirect}` : ""}`;
</script>

<a href={createUrl("github")}>Login with GitHub</a>
<a href={createUrl("discord")}>Login with Discord</a>
