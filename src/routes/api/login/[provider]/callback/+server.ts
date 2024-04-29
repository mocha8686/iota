import { PROVIDER_MAP, lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { log } from '$lib/server/log';
import { oauthAccounts, users } from '$lib/server/schema';
import { error, redirect } from '@sveltejs/kit';
import { OAuth2RequestError } from 'arctic';
import { and, eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, params }) => {
	const provider = PROVIDER_MAP.get(params.provider);
	if (!provider) error(404);
	const { validateAuthorizationCode, userInfo } = provider;

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	if (!code || !state || !storedState || state !== storedState) {
		const reason = !code
			? 'Missing code'
			: !state
				? 'Missing state'
				: !storedState
					? 'Missing stored state'
					: state !== storedState
						? 'States do not match'
						: 'Unknown reason';

		log.warn({ reason }, 'Bad callback');
		error(400);
	}

	try {
		const { accessToken } = await validateAuthorizationCode(code);
		const user = await userInfo(accessToken);

		const [existingAccount] = await db
			.select()
			.from(oauthAccounts)
			.where(
				and(
					eq(oauthAccounts.providerId, params.provider),
					eq(oauthAccounts.providerUserId, user.id),
				),
			);

		const link = cookies.get('link');
		if (link) {
			if (!existingAccount) {
				await db.insert(oauthAccounts).values({
					providerId: params.provider,
					providerUserId: user.id,
					userId: link,
				});
			}
		} else {
			if (existingAccount) {
				const session = await lucia.createSession(existingAccount.userId, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes,
				});
			} else {
				const userId = generateId(15);

				await db.transaction(async tx => {
					await tx.insert(users).values({
						id: userId,
						username: user.username,
						avatar: user.avatar,
					});
					await tx.insert(oauthAccounts).values({
						providerId: params.provider,
						providerUserId: user.id,
						userId,
					});
				});

				const session = await lucia.createSession(userId, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes,
				});
			}
		}
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			log.warn({ error: e }, 'OAuth error');
			error(400);
		} else {
			throw e;
		}
	}

	const redirectPath = cookies.get('redirect');
	redirect(302, redirectPath ?? '/app');
};
