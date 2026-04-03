import { handleUrlValidation } from "./url-validation";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		const body = await request.json<{ event?: string; payload?: { plainToken?: string } }>();

		if (body.event === "endpoint.url_validation") {
			const plainToken = body.payload?.plainToken;
			if (!plainToken) {
				return new Response("Bad Request", { status: 400 });
			}
			const result = await handleUrlValidation(plainToken, env.ZOOM_SECRET_TOKEN);
			return Response.json(result, { status: 200 });
		}

		return new Response("Not Found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
