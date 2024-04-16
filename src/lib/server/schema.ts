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
});

export const items = sqliteTable(
	'items',
	{
		id: integer('item_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		count: integer('count').notNull().default(1),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.id] }),
	}),
);
