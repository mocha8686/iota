import { db } from '$lib/server/db';
import { items } from '$lib/server/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/api/login');

	const dbRes = await db
		.select({ id: items.id, count: items.count })
		.from(items)
		.where(eq(items.userId, locals.user.id));

	return { items: dbRes };
};
