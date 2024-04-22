import { github, lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { users } from '$lib/server/schema';
import { error, redirect } from '@sveltejs/kit';
import { OAuth2RequestError } from 'arctic';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const redirectPath = cookies.get('redirect');
	const storedState = cookies.get('github_oauth_state') ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		const reason = !code
			? 'Missing code'
			: !state
				? 'Missing state'
				: state !== storedState
					? 'States do not match'
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

		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.githubId, githubUser.id))
			.limit(1);

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies.set(sessionCookie.name, sessionCookie.value, {
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
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes,
			});
		}
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			log.warn({ error: e }, 'OAuth error');
			error(400);
		} else {
			throw e;
		}
	}

	redirect(302, redirectPath ?? '/app');
};

interface GitHubUser {
	id: number;
	login: string;
}
