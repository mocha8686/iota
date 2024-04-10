import { z } from 'zod';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

const LocationId = z.coerce.number().min(0);

export const load: PageLoad = async ({ params }) => {
	const res = LocationId.safeParse(params.id);
	if (!res.success) error(400, 'Invalid location');

	return {
		id: res.data,
	};
};
