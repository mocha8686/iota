import { error, fail } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import itemsJson from '$lib/items.json';
import locations from '$lib/locations.json';
import { weightedRandom } from '$lib/rand';
import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { items } from '$lib/server/schema';

import type { Actions, PageServerLoad } from './$types';

const LocationId = z.coerce.number().min(0);

const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

export const load: PageServerLoad = async ({ params }) => {
	const res = LocationId.safeParse(params.id);
	if (!res.success) error(400, 'Invalid location');

	return {
		id: res.data,
	};
};

export const actions = {
	default: async ({ locals, params }) => {
		if (!locals.user) return fail(401);

		const res = LocationId.safeParse(params.id);
		if (!res.success) return fail(400, { message: 'Invalid location' });

		const location = locations[res.data];
		const encounter = Math.random() < location.encounterChance;

		if (encounter) {
			const enemies = weightedRandom(
				location.encounters.map((elem) => ({ item: elem.enemies, weight: elem.weight })),
			);
			return { type: 'encounter', enemies };
		} else {
			const data = weightedRandom(
				location.items.map((elem) => ({
					item: { id: elem.id, count: elem.count },
					weight: elem.weight,
				})),
			);

			const count =
				typeof data.count === 'number' ? data.count : randomInt(data.count[0], data.count[1]);

			const l = log.child({ userId: locals.user.id, itemId: data.id, count });

			try {
				await db
					.insert(items)
					.values({ id: data.id, userId: locals.user.id, count })
					.onConflictDoUpdate({
						target: [items.userId, items.id],
						set: { count: sql`${items.count} + ${count}` },
					});
				l.info('Added items to inventory');
			} catch (err) {
				l.error({ type: 'db', err }, 'Database error during scavenge');
				return fail(500, { message: 'Failed to save items.' });
			}

			const item = itemsJson[data.id];
			return { type: 'item', item: item.name, count };
		}
	},
} satisfies Actions;
