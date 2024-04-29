import { PROVIDER_MAP, checkUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { oauthAccounts } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async event => {
	const user = checkUser(event);

	const dbRes = await db
		.select({ providerId: oauthAccounts.providerId })
		.from(oauthAccounts)
		.where(eq(oauthAccounts.userId, user.id));
	const existingProviders = dbRes.map(row => row.providerId);

	const providers = Array.from(PROVIDER_MAP, ([id, provider]) => ({
		id,
		name: provider.name,
		disabled: existingProviders.includes(id),
	}));

	return { id: user.id, providers };
};
