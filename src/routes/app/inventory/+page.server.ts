import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { items } from '$lib/server/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return fail(401);

	const dbRes = await db
		.select({ id: items.id, quantity: items.quantity })
		.from(items)
		.where(eq(items.userId, locals.user.id));

	return { items: dbRes };
};
