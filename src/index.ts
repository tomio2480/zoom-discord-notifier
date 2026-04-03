export default {
	async fetch(_request: Request, _env: Env): Promise<Response> {
		return new Response("Hello, World!");
	},
} satisfies ExportedHandler<Env>;
