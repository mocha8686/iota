import { generateCodeVerifier } from 'oslo/oauth2';
import Fastify from 'fastify';
import { URLSearchParams } from 'node:url';
import { log } from '../log';
import formbody from '@fastify/formbody';

export const createOauthMockServer = () => {
	const fastify = Fastify();

	fastify.register(formbody);

	fastify.addHook('onRequest', (req, _res, done) => {
		log.debug({ method: req.method, url: req.url }, 'OAuth server request');
		done();
	});

	fastify.addHook('onError', (req, _res, err, done) => {
		log.debug(
			{ method: req.method, url: req.url, error: err },
			'OAuth server error',
		);
		done();
	});

	fastify.get('/', (_req, _res) => {
		return 'Hello, world!';
	});

	fastify.get('/authorize', async (req, res) => {
		const searchParams = new URLSearchParams(req.url.split('?')[1]);

		const responseType = searchParams.get('response_type');
		const clientId = searchParams.get('client_id');
		const state = searchParams.get('state');
		const redirectUri = searchParams.get('redirect_uri');

		log.debug(
			{
				searchParams: searchParams.toString(),
				responseType,
				clientId,
				state,
				redirectUri,
			},
			'Authorize',
		);

		if (
			responseType !== 'code' ||
			clientId !== 'test' ||
			!state ||
			!redirectUri
		) {
			res.code(400).send();
			return;
		}

		const redirectUrl = new URL(redirectUri);
		redirectUrl.searchParams.set('state', state);
		redirectUrl.searchParams.set('code', generateCodeVerifier());

		res.code(302).header('Location', redirectUrl.toString()).send();
	});

	fastify.post('/token', async (_req, res) => {
		res.send({
			access_token: generateCodeVerifier(),
		});
	});

	return fastify;
};
