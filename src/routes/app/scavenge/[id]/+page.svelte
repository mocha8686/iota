<script lang="ts">
	import locations from '$lib/locations.json';
	import items from '$lib/items.json';
	import { enhance } from '$app/forms';

	const { data, form } = $props();

	function formatTime(time: number): string {
		const hours = Math.floor(time / 60 / 60);
		const minutes = Math.floor((time % (60 * 60)) / 60);
		const seconds = time % 60;

		const h = hours.toString();
		const m = minutes.toString().padStart(2, '0');
		const s = seconds.toString().padStart(2, '0');

		return `${h}:${m}:${s}`;
	}
</script>

<h1>{locations[data.id].name}</h1>

<form method="POST" use:enhance>
	<button name="minutes" value="30">Scavenge for 30 minutes</button>
	<button name="minutes" value="60">Scavenge for 60 minutes</button>
</form>

{#if form?.events}
	<ol>
		{#each form.events as event}
			<li>
				<time datetime={`${event.time}s`}>{formatTime(event.time)}</time>
				{#if event.type === 'item'}
					Name found {event.count} {items[event.id].name}
				{:else if event.type === 'encounter'}
					Team came across {event.enemies.map((enemy) => `#${enemy.id} x${enemy.count}`).join(', ')}
				{/if}
			</li>
		{/each}
	</ol>
{/if}
