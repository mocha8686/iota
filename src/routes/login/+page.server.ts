import { PROVIDER_MAP } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectPath = url.searchParams.get('redirect');
	if (locals.user) redirect(302, redirectPath ?? '/app');

	const providers = Array.from(PROVIDER_MAP, ([id, provider]) => ({
		id,
		name: provider.name,
	}));

	return { redirect: redirectPath, providers };
};
