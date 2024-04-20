import { dev } from '$app/environment';
import { github } from '$lib/server/auth';
import { type RequestEvent, redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
	const state = generateState();
	const url = await github.createAuthorizationURL(state);

	event.cookies.set('github_oauth_state', state, {
		path: '/',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
	});

	redirect(302, url);
};
