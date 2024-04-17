import { dev } from '$app/environment';
import pino, { type LoggerOptions } from 'pino';

const options = dev
	? ({
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: true,
				},
			},
		} satisfies LoggerOptions)
	: undefined;

export const log = pino(options);
