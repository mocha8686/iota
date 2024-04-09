import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').notNull().primaryKey(),
	githubId: integer('github_id').unique().notNull(),
	username: text('username').notNull(),
});

export const sessions = sqliteTable('sessions', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at').notNull(),
});

export const characters = sqliteTable('characters', {
	id: integer('id').notNull().primaryKey(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	inventory: text('inventory', { mode: 'json' }).default('[]'),
});

export const items = sqliteTable(
	'items',
	{
		id: integer('item_id').notNull(),
		characterId: integer('character_id')
			.notNull()
			.references(() => characters.id),
		quantity: integer('quantity').notNull().default(1),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.characterId, t.id] }),
	}),
);
