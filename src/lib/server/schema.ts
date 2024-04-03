import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
});

export const session = sqliteTable('session', {
	id: text('id').notNull().primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at').notNull(),
});
