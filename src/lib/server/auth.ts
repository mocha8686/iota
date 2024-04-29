import { dev } from '$app/environment';
import {
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	DISCORD_REDIRECT_URI,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
} from '$env/static/private';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Discord, GitHub, type OAuth2Provider } from 'arctic';
import { Lucia } from 'lucia';
import { db } from './db';
import { sessions, users } from './schema';
import { redirect, type RequestEvent } from '@sveltejs/kit';

export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);
export const discord = new Discord(
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	DISCORD_REDIRECT_URI,
);

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev,
		},
	},
	getUserAttributes: attributes => {
		return {
			username: attributes.username,
			avatar: attributes.avatar,
		};
	},
});

interface DatabaseUserAttributes {
	username: string;
	avatar: string | undefined;
}

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

export type UserInfo = (token: string) => Promise<typeof users.$inferInsert>;

export const githubUserInfo: UserInfo = async (accessToken: string) => {
	interface User {
		id: number;
		login: string;
		avatar_url: string;
	}
	const data = await providerFetch<User>(
		'https://api.github.com/user',
		accessToken,
	);
	return {
		id: data.id.toString(),
		username: data.login,
		avatar: data.avatar_url,
	};
};

export const discordUserInfo: UserInfo = async (accessToken: string) => {
	interface User {
		id: string;
		username: string;
		avatar: string | undefined;
	}
	const data = await providerFetch<User>(
		'https://discord.com/api/v10/users/@me',
		accessToken,
	);
	return {
		id: data.id,
		username: data.username,
		avatar: data.avatar,
	};
};

interface Provider {
	createAuthorizationURL: OAuth2Provider['createAuthorizationURL'];
	validateAuthorizationCode: OAuth2Provider['validateAuthorizationCode'];
	userInfo: UserInfo;
}

export const PROVIDER_MAP: Map<string, Provider> = new Map([
	[
		'github',
		{
			createAuthorizationURL: github.createAuthorizationURL.bind(github),
			validateAuthorizationCode: github.validateAuthorizationCode.bind(github),
			userInfo: githubUserInfo,
		},
	],
	[
		'discord',
		{
			createAuthorizationURL: async (state: string) =>
				await discord.createAuthorizationURL(state, { scopes: ['identify'] }),
			validateAuthorizationCode:
				discord.validateAuthorizationCode.bind(discord),
			userInfo: discordUserInfo,
		},
	],
]);

const providerFetch = async <T>(
	url: URL | string,
	accessToken: string,
): Promise<T> => {
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	const data: T = await res.json();
	return data;
};

export const checkUser = ({ locals, url }: RequestEvent): Exclude<App.Locals['user'], null> => {
	if (!locals.user) {
		const loginUrl = new URL('/login', url);
		loginUrl.searchParams.set('redirect', url.pathname);
		redirect(302, loginUrl);
	}
	return locals.user;
};
