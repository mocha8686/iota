import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import items from '$lib/items.json';
import locations from '$lib/locations.json';
import { weightedRandom } from '$lib/rand';

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
	default: async ({ params }) => {
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

			const item = items[data.id];
			const count =
				typeof data.count === 'number' ? data.count : randomInt(data.count[0], data.count[1]);
			return { type: 'item', item: item.name, count };
		}
	},
} satisfies Actions;
