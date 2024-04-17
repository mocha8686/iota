import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$env/static/private';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { characters } from './schema';

const conn = createClient({
	url: TURSO_DATABASE_URL,
	authToken: TURSO_AUTH_TOKEN,
});

export const db = drizzle(conn);

export const withCharacter = (userId: string) =>
	db
		.$with('character')
		.as(
			db
				.select({ id: characters.id })
				.from(characters)
				.where(eq(characters.userId, userId)),
		);
