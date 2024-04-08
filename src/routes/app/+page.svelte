<script lang="ts">
	import GridTransition from '$lib/components/GridTransition.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();
</script>

<h1>Welcome, {data.username}!</h1>

<GridTransition />
