import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { OAuth2RequestError } from 'arctic';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';

import { github, lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { users } from '$lib/server/schema';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		const reason =
			!code ? 'Missing code'
			: !state ? 'Missing state'
			: state !== storedState ? 'States do not match'
			: 'Unknown reason';

		log.warn({ reason }, 'Bad callback');
		error(400);
	}

	try {
		const { accessToken } = await github.validateAuthorizationCode(code);
		const githubUserRequest = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		const githubUser: GitHubUser = await githubUserRequest.json();

		const existingUser = (
			await db.select().from(users).where(eq(users.githubId, githubUser.id)).limit(1)
		).at(0);

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes,
			});
		} else {
			const userId = generateId(15);

			await db.insert(users).values({
				id: userId,
				githubId: githubUser.id,
				username: githubUser.login,
			});

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes,
			});
		}
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			log.warn({ error: e }, 'OAuth error');
			error(400);
		} else {
			log.error({ error: e }, 'Error during login callback');
			error(500);
		}
	}

	redirect(302, '/app');
}

interface GitHubUser {
	id: number;
	login: string;
}
