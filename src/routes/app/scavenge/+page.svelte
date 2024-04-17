<script lang="ts">
	import locations from "$lib/locations.json";
</script>

<h1>Scavenge</h1>

<ul>
	{#each locations as location, id}
		<li><a href={`./scavenge/${id}`}>{location.name}</a></li>
	{/each}
</ul>
