import { type TimedEvent, generateRandomEvent } from '$lib/locations';
import { randomInt } from '$lib/rand';
import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { expeditions } from '$lib/server/schema';
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { addToInventory } from '$lib/server/items';
import { isItemEvent } from '$lib/locations';
import locations from '$lib/locations.json';
import { checkUser } from '$lib/server/auth';

const LocationId = z.coerce.number().min(0);

export const load: PageServerLoad = async event => {
	const user = checkUser(event);

	const res = LocationId.safeParse(event.params.id);
	const location = res.success && locations.at(res.data);
	if (!location) error(404, 'Invalid location');

	const [expedition] = await db
		.select({ time: expeditions.time, events: expeditions.events })
		.from(expeditions)
		.where(eq(expeditions.userId, user.id))
		.limit(1);

	return {
		location: location.name,
		expedition,
	};
};

export const actions = {
	continue: async event => {
		const user = checkUser(event);

		const l = log.child({ userId: user.id });

		const res = LocationId.safeParse(event.params.id);
		if (!res.success) return fail(400, { message: 'Invalid location' });
		const locationId = res.data;

		// TODO: transactions
		const [expedition] = await db
			.select({ time: expeditions.time, events: expeditions.events })
			.from(expeditions)
			.where(eq(expeditions.userId, user.id))
			.limit(1);

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

		await db
			.insert(expeditions)
			.values({ userId: user.id, locationId, time, events })
			.onConflictDoUpdate({
				target: expeditions.userId,
				set: { time, events },
			});
		l.info('Saved expedition');

		return { events };
	},
	return: async event => {
		const user = checkUser(event);

		const [expedition] = await db
			.select({ events: expeditions.events })
			.from(expeditions)
			.where(eq(expeditions.userId, user.id))
			.limit(1);

		if (!expedition) return fail(404, { message: 'Expedition not found' });

		const itemEvents = expedition.events
			.filter(isItemEvent)
			.map(event => ({ id: event.id, count: event.count }));
		await addToInventory(user.id, itemEvents);

		await db.delete(expeditions).where(eq(expeditions.userId, user.id));
	},
} satisfies Actions;
