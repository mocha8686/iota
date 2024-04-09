import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { z } from 'zod';
import { db, withCharacter } from '$lib/server/db';
import { items } from '$lib/server/schema';
import { and, eq, sql } from 'drizzle-orm';

const Scavenge = z.object({
	itemId: z.coerce.number({ required_error: 'Item ID is required' }),
	quantity: z.coerce.number().min(1, 'Quantity must be 1 or more').default(1),
});

export const actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) return fail(401);

		const form = await request.formData();
		const itemId = form.get('item-id');
		const quantity = form.get('quantity');

		const res = Scavenge.safeParse({ itemId, quantity });
		if (!res.success) {
			return fail(400, { error: res.error.toString() });
		}

		const data = res.data;
		const character = withCharacter(locals.user.id);
		const dbRes = await db
			.with(character)
			.insert(items)
			.values({
				id: data.itemId,
				characterId: sql`(SELECT ${character.id} FROM ${character})`,
				quantity: data.quantity,
			})
			.onConflictDoUpdate({
				target: [items.characterId, items.id],
				set: { quantity: sql`${items.quantity} + ${data.quantity}` },
			});

		if (dbRes.rowsAffected < 1) {
			return fail(500, {
				itemId: data.itemId,
				quantity: data.quantity,
				error: 'Failed to update items',
			});
		}
	},
} satisfies Actions;
