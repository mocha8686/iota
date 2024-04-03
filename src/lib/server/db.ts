import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const conn = createClient({
	url: process.env.TURSO_DATABASE_URL ?? '',
	authToken: process.env.TURSO_AUTH_TOKEN ?? '',
});

export const db = drizzle(conn);

await migrate(db, { migrationsFolder: './drizzle' });
