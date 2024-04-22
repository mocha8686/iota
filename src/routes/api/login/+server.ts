import { github } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const state = generateState();
	const githubUrl = await github.createAuthorizationURL(state);

	cookies.set('github_oauth_state', state, {
		path: '/',
		maxAge: 60 * 10,
		sameSite: 'lax',
	});

	const redirectPath = url.searchParams.get('redirect');
	if (redirectPath) {
		cookies.set('redirect', redirectPath, { path: '/api/login/callback' });
	}

	redirect(302, githubUrl);
};
