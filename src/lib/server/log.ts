import pino, { type LoggerOptions } from 'pino';

import { dev } from '$app/environment';

const options =
	dev ?
		({
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: true,
				},
			},
		} satisfies LoggerOptions)
	:	undefined;

export const log = pino(options);
