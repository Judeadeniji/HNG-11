djimport { server } from './routes.';

export default {
	fetch: server.fetch,
} satisfies ExportedHandler<Env>;
