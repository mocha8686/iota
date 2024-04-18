<script lang="ts">
	import { enhance } from "$app/forms";
	import items from "$lib/items.json";
	import { isItemEvent, isEncounterEvent } from "$lib/locations";
	import locations from "$lib/locations.json";

	const { data, form } = $props();

	const events = $derived(form?.events ?? data.expedition?.events);

	function formatTime(time: number): string {
		const hours = Math.floor(time / 60 / 60);
		const minutes = Math.floor((time % (60 * 60)) / 60);
		const seconds = time % 60;

		const h = hours.toString();
		const m = minutes.toString().padStart(2, "0");
		const s = seconds.toString().padStart(2, "0");

		return `${h}:${m}:${s}`;
	}
</script>

<h1>{locations[data.id].name}</h1>

<form method="POST" use:enhance>
	<button formaction="?/continue">Scavenge</button>
	{#if data.expedition}
		<button formaction="?/return">Return</button>
	{/if}
</form>

{#if events}
	<ol>
		{#each events as event}
			<li>
				<time datetime={`${event.time}s`}>
					{formatTime(event.time)}
				</time>
				{#if isItemEvent(event)}
					Name found {event.count} {items[event.id].name}
				{:else if isEncounterEvent(event)}
					Team came across {event.enemies
						.map((enemy) => `#${enemy.id} x${enemy.count}`)
						.join(", ")}
				{/if}
			</li>
		{/each}
	</ol>
{/if}
