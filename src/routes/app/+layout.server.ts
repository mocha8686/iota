import { db } from '$lib/server/db';
import { characters, expeditions } from '$lib/server/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { checkUser } from '$lib/server/auth';

const CHARACTER_PATHNAME = '/app/character';

const generateScavengePathname = (id: number | undefined) =>
	id ? `/app/scavenge/${id}` : undefined;

export const load: LayoutServerLoad = async event => {
	const user = checkUser(event);
	const pathname = event.url.pathname;

	const [character] = await db
		.select({ name: characters.name, id: characters.id })
		.from(characters)
		.where(eq(characters.userId, user.id))
		.limit(1);

	if (!character && pathname !== CHARACTER_PATHNAME)
		redirect(302, CHARACTER_PATHNAME);

	const [expedition] = await db
		.select({ locationId: expeditions.locationId })
		.from(expeditions)
		.where(eq(expeditions.userId, user.id))
		.limit(1);

	const scavengePathname = generateScavengePathname(expedition?.locationId);
	if (scavengePathname && pathname !== scavengePathname)
		redirect(302, scavengePathname);

	return {
		username: user.username,
		pathname,
		avatar: user.avatar,
		character,
	};
};
