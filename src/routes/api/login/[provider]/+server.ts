import { PROVIDER_MAP } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url, params }) => {
	const provider = PROVIDER_MAP.get(params.provider);
	if (!provider) error(404);

	const state = generateState();
	const authorizationUrl = await provider.createAuthorizationURL(state);

	cookies.set('oauth_state', state, {
		path: '/api/login',
		maxAge: 60 * 10,
		sameSite: 'lax',
	});

	const redirectPath = url.searchParams.get('redirect');
	if (redirectPath) {
		cookies.set('redirect', redirectPath, { path: '/api/login' });
	}

	redirect(302, authorizationUrl);
};
