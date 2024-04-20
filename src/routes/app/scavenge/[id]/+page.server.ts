import { type TimedEvent, generateRandomEvent } from '$lib/locations';
import { randomInt } from '$lib/rand';
import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { expeditions } from '$lib/server/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { addToInventory } from '$lib/server/items';
import { isItemEvent } from '$lib/locations';
	import locations from "$lib/locations.json";

const LocationId = z.coerce.number().min(0);

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(302, '/api/login');

	const res = LocationId.safeParse(params.id);
	const location = res.success && locations.at(res.data);
	if (!location) error(404, 'Invalid location');

	const expedition = (
		await db
			.select({ time: expeditions.time, events: expeditions.events })
			.from(expeditions)
			.where(eq(expeditions.userId, locals.user.id))
			.limit(1)
	).at(0);

	return {
		location: location.name,
		expedition,
	};
};

export const actions = {
	continue: async ({ locals, params }) => {
		if (!locals.user) return fail(401);

		const l = log.child({ userId: locals.user.id });

		const res = LocationId.safeParse(params.id);
		if (!res.success) return fail(400, { message: 'Invalid location' });
		const locationId = res.data;

		// TODO: try/catch
		// TODO: transactions
		const expedition = (
			await db
				.select({ time: expeditions.time, events: expeditions.events })
				.from(expeditions)
				.where(eq(expeditions.userId, locals.user.id))
				.limit(1)
		).at(0);

		let time = expedition?.events.at(-1)?.time ?? 0;
		const events: TimedEvent[] = expedition?.events ?? [];

		while (true) {
			const timeToNextEvent = randomInt(1 * 60, 10 * 60);
			time += timeToNextEvent;

			const event = generateRandomEvent(locationId);
			events.push({ ...event, time });
			if (event.type === 'encounter') {
				break;
			}
		}

		try {
			await db
				.insert(expeditions)
				.values({ userId: locals.user.id, locationId, time, events })
				.onConflictDoUpdate({
					target: expeditions.userId,
					set: { time, events },
				});
			l.info('Saved expedition');
		} catch (err) {
			l.error({ type: 'db', err }, 'Database error during expedition');
			return fail(500);
		}

		return { events };
	},
	return: async ({ locals }) => {
		if (!locals.user) return fail(401);

		const l = log.child({ userId: locals.user.id });

		const expedition = (
			await db
				.select({ events: expeditions.events })
				.from(expeditions)
				.where(eq(expeditions.userId, locals.user.id))
				.limit(1)
		).at(0);
		if (!expedition) return fail(404, { message: 'Expedition not found' });

		const itemEvents = expedition.events
			.filter(isItemEvent)
			.map(event => ({ id: event.id, count: event.count }));
		await addToInventory(locals.user.id, itemEvents);

		await db.delete(expeditions).where(eq(expeditions.userId, locals.user.id));
	},
} satisfies Actions;
