import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { characters } from '$lib/server/schema';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { CreateCharacter, DeleteCharacter } from './schema';
import { checkUser } from '$lib/server/auth';

export const load: PageServerLoad = async event => {
	const user = checkUser(event);

	const createForm = await superValidate(zod(CreateCharacter));
	const deleteForm = await superValidate(zod(DeleteCharacter));

	const userCharacters = await db
		.select()
		.from(characters)
		.where(eq(characters.userId, user.id));

	return {
		createForm,
		deleteForm,
		characters: userCharacters,
	};
};

export const actions = {
	create: async event => {
		const user = checkUser(event);

		const l = log.child({ userId: user.id });
		const createForm = await superValidate(event.request, zod(CreateCharacter));

		if (!createForm.valid) {
			return fail(400, { createForm });
		}

		try {
			const { characterId } = (
				await db
					.insert(characters)
					.values({ name: createForm.data.name, userId: user.id })
					.returning({ characterId: characters.id })
			)[0];
			l.info({ characterId }, 'Created character');
		} catch (err) {
			l.error({ type: 'db', err }, 'Database error during character creation');
			return message(createForm, 'Failed to save character.', { status: 500 });
		}

		return { createForm };
	},
	delete: async event => {
		const user = checkUser(event);

		const l = log.child({ userId: user.id });
		const deleteForm = await superValidate(event.request, zod(DeleteCharacter));

		if (!deleteForm.valid) {
			return fail(400, { deleteForm });
		}

		try {
			const [character] = await db
				.delete(characters)
				.where(eq(characters.id, deleteForm.data.id))
				.returning({ characterId: characters.id });

			if (!character) {
				return message(deleteForm, 'Character does not exist.', {
					status: 400,
				});
			}

			l.info({ characterId: character.characterId }, 'Deleted character');
		} catch (err) {
			l.error({ type: 'db', err }, 'Database error during character creation');
			return message(deleteForm, 'Failed to delete character.', {
				status: 500,
			});
		}

		return message(deleteForm, 'Deleted character.');
	},
} satisfies Actions;
