import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { characters } from '$lib/server/schema';

import type { PageServerLoad, Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms';
import { log } from '$lib/server/log';
import { CreateCharacter, DeleteCharacter } from './schema';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/api/login');

	const createForm = await superValidate(zod(CreateCharacter));
	const deleteForm = await superValidate(zod(DeleteCharacter));

	const userCharacters = await db
		.select()
		.from(characters)
		.where(eq(characters.userId, locals.user.id));

	return {
		createForm,
		deleteForm,
		characters: userCharacters,
	};
};

export const actions = {
	create: async ({ locals, request }) => {
		if (!locals.user) return fail(401);

		const l = log.child({ userId: locals.user.id });
		const createForm = await superValidate(request, zod(CreateCharacter));

		if (!createForm.valid) {
			return fail(400, { createForm });
		}

		try {
			const { characterId } = (
				await db
					.insert(characters)
					.values({ name: createForm.data.name, userId: locals.user.id })
					.returning({ characterId: characters.id })
			)[0];
			l.info({ characterId }, 'Created character');
		} catch (err) {
			l.error({ type: 'db', err }, 'Database error during character creation');
			return message(createForm, 'Failed to save character.', { status: 500 });
		}

		return { createForm };
	},
	delete: async ({ locals, request }) => {
		if (!locals.user) return fail(401);

		const l = log.child({ userId: locals.user.id });
		const deleteForm = await superValidate(request, zod(DeleteCharacter));

		if (!deleteForm.valid) {
			return fail(400, { deleteForm });
		}

		try {
			const res = (
				await db
					.delete(characters)
					.where(eq(characters.id, deleteForm.data.id))
					.returning({ characterId: characters.id })
			).at(0);

			if (!res) {
				return message(deleteForm, 'Character does not exist.', { status: 400 });
			}

			l.info({ characterId: res.characterId }, 'Deleted character');
		} catch (err) {
			l.error({ type: 'db', err }, 'Database error during character creation');
			return message(deleteForm, 'Failed to delete character.', { status: 500 });
		}

		return message(deleteForm, 'Deleted character.');
	},
} satisfies Actions;
