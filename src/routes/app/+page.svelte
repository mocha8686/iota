<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();
</script>

<h1>Welcome, {data.username}!</h1>
<a href="/api/logout">Logout</a>
