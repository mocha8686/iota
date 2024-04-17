import { lucia } from '$lib/server/auth';
import { type RequestEvent, redirect } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
	if (event.locals.session) {
		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}
	redirect(302, '/');
}
