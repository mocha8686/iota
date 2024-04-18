import type { CountedStub } from '$lib/types';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { items } from './schema';

export async function addToInventory(userId: string, entries: CountedStub[]) {
	const itemCounts = entries.reduce<Record<number, number>>((acc, item) => {
		const oldVal = acc[item.id] ?? 0;
		acc[item.id] = oldVal + item.count;
		return acc;
	}, {});

	const rows = Object.entries(itemCounts).map(([id, count]) => ({
		id: Number(id),
		userId,
		count,
	}));

	await db
		.insert(items)
		.values(rows)
		.onConflictDoUpdate({
			target: [items.userId, items.id],
			set: { count: sql`${items.count} + excluded.count` },
		});
}
