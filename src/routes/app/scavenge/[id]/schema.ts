import { z } from 'zod';

export const ScavengeRequest = z.object({
	minutes: z.number().min(1),
});
