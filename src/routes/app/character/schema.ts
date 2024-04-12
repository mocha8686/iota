import { z } from 'zod';

export const CreateCharacter = z.object({
	name: z.string({ required_error: 'Name is required' }).min(1, 'Name cannot be empty'),
});

export const DeleteCharacter = z.object({
	id: z.number({ required_error: 'ID is required' }).positive('ID cannot be negative'),
});

