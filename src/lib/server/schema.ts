import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').notNull().primaryKey(),
	githubId: integer('github_id').unique().notNull(),
	username: text('username').notNull(),
});

export const sessions = sqliteTable('sessions', {
	id: text('id').notNull().primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at').notNull(),
});
