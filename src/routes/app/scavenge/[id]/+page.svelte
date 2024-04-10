<script lang="ts">
	import locations from '$lib/locations.json';

	const { data } = $props();
</script>

<h1>{locations[data.id].name}</h1>
