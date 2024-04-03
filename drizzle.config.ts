import dotenv from 'dotenv';
import { Config } from 'drizzle-kit';

dotenv.config();

export default {
	schema: './src/lib/server/schema.ts',
	out: './drizzle',
	driver: 'turso',
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL ?? '',
		authToken: process.env.TURSO_AUTH_TOKEN ?? '',
	},
} satisfies Config;
