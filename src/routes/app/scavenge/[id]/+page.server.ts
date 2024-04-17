import itemsJson from '$lib/items.json';
import {
	type Event as LocationEvent,
	generateRandomEvent,
} from '$lib/location';
import locations from '$lib/locations.json';
import { randomInt, weightedRandom } from '$lib/rand';
import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { items } from '$lib/server/schema';
import { error, fail } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { ScavengeRequest } from './schema';

type Event = LocationEvent & { time: number };

const LocationId = z.coerce.number().min(0);

export const load: PageServerLoad = async ({ params }) => {
	const res = LocationId.safeParse(params.id);
	if (!res.success) error(404, 'Invalid location');

	return {
		id: res.data,
	};
};

export const actions = {
	default: async ({ locals, params, request }) => {
		if (!locals.user) return fail(401);

		const res = LocationId.safeParse(params.id);
		if (!res.success) return fail(400, { message: 'Invalid location' });

		const form = await superValidate(request, zod(ScavengeRequest));
		if (!form.valid) return fail(400, { message: 'Invalid time' });

		const locationId = res.data;
		const duration = form.data.minutes * 60;

		let time = 0;
		const events: Event[] = [];

		while (true) {
			const timeToNextEvent = randomInt(1 * 60, 10 * 60);
			time += timeToNextEvent;
			if (time > duration) break;

			const event = generateRandomEvent(locationId);
			events.push({ ...event, time });
			if (event.type === 'encounter') {
				break;
			}
		}

		return { events };
	},
} satisfies Actions;
