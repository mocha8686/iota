import type { TimedEvent } from '$lib/locations';
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').notNull().primaryKey(),
	username: text('username').notNull(),
	avatar: text('avatar'),
});

export const oauthAccounts = sqliteTable(
	'oauth_accounts',
	{
		providerId: text('provider_id').notNull(),
		providerUserId: text('provider_user_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
	},
	t => ({
		pk: primaryKey({ columns: [t.providerId, t.providerUserId] }),
	}),
);

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
	t => ({
		pk: primaryKey({ columns: [t.userId, t.id] }),
	}),
);

export const expeditions = sqliteTable('expeditions', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id),
	locationId: integer('location_id').notNull(),
	time: integer('time').notNull(),
	events: text('events', { mode: 'json' }).notNull().$type<TimedEvent[]>(),
});
