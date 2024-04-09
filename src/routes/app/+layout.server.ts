import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { characters } from '$lib/server/schema';

import type { LayoutServerLoad } from './$types';

const CHARACTER_PATHNAME = '/app/character';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(302, '/api/login');

	const character = (
		await db
			.select({ name: characters.name, id: characters.id })
			.from(characters)
			.where(eq(characters.userId, locals.user.id))
			.limit(1)
	).at(0);
	if (!character && url.pathname !== CHARACTER_PATHNAME) redirect(302, '/app/character');

	return {
		username: locals.user.username,
		pathname: url.pathname,
		character,
	};
};
