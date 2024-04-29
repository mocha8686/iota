import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectPath = url.searchParams.get('redirect');
	if (locals.user) redirect(302, redirectPath ?? '/app');
	return { redirect: redirectPath };
};
