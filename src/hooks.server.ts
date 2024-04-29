import { lucia } from '$lib/server/auth';
import { log } from '$lib/server/log';
import { type Handle, type HandleServerError, error } from '@sveltejs/kit';
import { verifyRequestOrigin } from 'lucia';

export const handle: Handle = async ({ event, resolve }) => {
	log.info(
		{
			method: event.request.method,
			url: event.url,
		},
		'HTTP Request',
	);

	if (event.request.method !== 'GET') {
		const originHeader = event.request.headers.get('Origin');
		const hostHeader = event.request.headers.get('Host');
		if (
			!originHeader ||
			!hostHeader ||
			!verifyRequestOrigin(originHeader, [hostHeader])
		) {
			log.warn({ origin: originHeader }, 'Failed request origin verification');
			error(403);
		}
	}

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session?.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	} else if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

export const handleError: HandleServerError = async ({
	error,
	event,
	status,
	message,
}) => {
	const errorId = crypto.randomUUID();
	log.error({ errorId, error, event, status, message }, 'Server error');
	return { message: 'Whoops!', errorId };
};
