import { parseParticipantJoined } from "./participant-joined";
import { verifySignature } from "./signature-verification";
import { handleUrlValidation } from "./url-validation";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		const rawBody = await request.text();
		let body: { event?: string; payload?: { plainToken?: string } };
		try {
			body = JSON.parse(rawBody);
		} catch {
			return new Response("Bad Request", { status: 400 });
		}

		if (body.event === "endpoint.url_validation") {
			const plainToken = body.payload?.plainToken;
			if (!plainToken) {
				return new Response("Bad Request", { status: 400 });
			}
			const result = handleUrlValidation(plainToken, env.ZOOM_SECRET_TOKEN);
			return Response.json(result, { status: 200 });
		}

		const signature = request.headers.get("x-zm-signature") ?? "";
		const timestamp = request.headers.get("x-zm-request-timestamp") ?? "";
		if (!verifySignature(signature, timestamp, rawBody, env.ZOOM_WEBHOOK_SECRET_TOKEN)) {
			return new Response("Unauthorized", { status: 401 });
		}

		if (body.event === "meeting.participant_joined") {
			const data = parseParticipantJoined(body);
			if (!data) {
				return new Response("Bad Request", { status: 400 });
			}
			return Response.json(data, { status: 200 });
		}

		return new Response("Not Found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
