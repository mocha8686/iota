import { db } from '$lib/server/db';
import { characters, expeditions } from '$lib/server/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

const CHARACTER_PATHNAME = '/app/character';

const generateScavengePathname = (id: number | undefined) =>
	id ? `/app/scavenge/${id}` : undefined;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const loginUrl = new URL('/api/login', url);
		loginUrl.searchParams.set('redirect', url.pathname);
		redirect(302, loginUrl);
	};

	const [character] = await db
		.select({ name: characters.name, id: characters.id })
		.from(characters)
		.where(eq(characters.userId, locals.user.id))
		.limit(1);

	if (!character && url.pathname !== CHARACTER_PATHNAME)
		redirect(302, CHARACTER_PATHNAME);

	const [expedition] = await db
		.select({ locationId: expeditions.locationId })
		.from(expeditions)
		.where(eq(expeditions.userId, locals.user.id))
		.limit(1);

	const scavengePathname = generateScavengePathname(expedition?.locationId);
	if (scavengePathname && url.pathname !== scavengePathname)
		redirect(302, scavengePathname);

	return {
		username: locals.user.username,
		pathname: url.pathname,
		character,
	};
};
