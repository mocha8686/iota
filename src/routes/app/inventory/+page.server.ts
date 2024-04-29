import { checkUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { items } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async event => {
	const user = checkUser(event);

	const dbRes = await db
		.select({ id: items.id, count: items.count })
		.from(items)
		.where(eq(items.userId, user.id));

	return { items: dbRes };
};
