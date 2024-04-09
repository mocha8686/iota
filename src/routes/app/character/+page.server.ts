import { redirect } from '@sveltejs/kit';
import { characters } from '$lib/server/schema';
import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';

import { fail } from '@sveltejs/kit';

import type { Actions } from './$types';
import { z } from 'zod';

const NewCharacter = z.object({
	name: z.string({ required_error: 'Name is required' }).min(1, 'Name cannot be empty'),
});

export const actions = {
	create: async ({ locals, request }) => {
		if (!locals.user) return fail(401);

		const form = await request.formData();
		const name = form.get('name');

		const res = NewCharacter.safeParse({ name });
		if (!res.success) {
			return fail(400, { name, error: res.error.toString() });
		}

		const data = res.data;
		const dbRes = await db.insert(characters).values({ name: data.name, userId: locals.user.id });

		if (dbRes.rowsAffected < 1) {
			return fail(500, { name, error: 'Failed to save character' });
		}
	},
	delete: async ({ locals }) => {
		if (!locals.user) return fail(401);

		const res = await db.delete(characters).where(eq(characters.userId, locals.user.id));
		if (res.rowsAffected < 1) {
			return fail(500, { error: 'Failed to delete character' });
		}

		return { success: true };
	},
} satisfies Actions;

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(302, '/api/login');

	const character = (
		await db.select().from(characters).where(eq(characters.userId, locals.user.id)).limit(1)
	).at(0);

	return {
		username: locals.user.username,
		pathname: url.pathname,
		character,
	};
};
