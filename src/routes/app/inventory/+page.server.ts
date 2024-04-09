import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db, withCharacter } from '$lib/server/db';
import { items } from '$lib/server/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return fail(401);

	const character = withCharacter(locals.user.id);
	const dbRes = await db
		.with(character)
		.select({ id: items.id, quantity: items.quantity })
		.from(items)
		.leftJoin(character, eq(items.characterId, character.id));

	return { items: dbRes };
};
