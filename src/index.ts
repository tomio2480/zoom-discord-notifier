import {
	sendEndedNotification,
	sendJoinedNotification,
	sendLeftNotification,
} from "./discord-notification";
import { parseMeetingEnded } from "./meeting-ended";
import { decrementCount, incrementCount, resetCount } from "./participant-count";
import { parseParticipantJoined } from "./participant-joined";
import { parseParticipantLeft } from "./participant-left";
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

		const meetingId = (body as { payload?: { object?: { id?: unknown } } }).payload?.object?.id;
		if (meetingId === undefined || meetingId === null) {
			return new Response("Bad Request", { status: 400 });
		}
		if (String(meetingId) !== env.ZOOM_MEETING_ID) {
			return new Response("OK", { status: 200 });
		}

		if (body.event === "meeting.participant_joined") {
			const parsed = parseParticipantJoined(body);
			if (!parsed) {
				return new Response("Bad Request", { status: 400 });
			}
			const participantCount = await incrementCount(env.PARTICIPANT_STORE, env.ZOOM_MEETING_ID);
			const data = {
				meetingName: env.MEETING_DISPLAY_NAME || parsed.meetingName,
				joinTime: parsed.joinTime,
				participantCount,
			};
			const result = await sendJoinedNotification(env.DISCORD_WEBHOOK_URL, data);
			if (!result.ok) {
				return new Response("Bad Gateway", { status: 502 });
			}
			return new Response("OK", { status: 200 });
		}

		if (body.event === "meeting.participant_left") {
			const parsed = parseParticipantLeft(body);
			if (!parsed) {
				return new Response("Bad Request", { status: 400 });
			}
			const participantCount = await decrementCount(env.PARTICIPANT_STORE, env.ZOOM_MEETING_ID);
			const data = {
				meetingName: env.MEETING_DISPLAY_NAME || parsed.meetingName,
				leaveTime: parsed.leaveTime,
				participantCount,
			};
			const result = await sendLeftNotification(env.DISCORD_WEBHOOK_URL, data);
			if (!result.ok) {
				return new Response("Bad Gateway", { status: 502 });
			}
			return new Response("OK", { status: 200 });
		}

		if (body.event === "meeting.ended") {
			const parsed = parseMeetingEnded(body);
			if (!parsed) {
				return new Response("Bad Request", { status: 400 });
			}
			await resetCount(env.PARTICIPANT_STORE, env.ZOOM_MEETING_ID);
			const data = {
				meetingName: env.MEETING_DISPLAY_NAME || parsed.meetingName,
				endTime: parsed.endTime,
			};
			const result = await sendEndedNotification(env.DISCORD_WEBHOOK_URL, data);
			if (!result.ok) {
				return new Response("Bad Gateway", { status: 502 });
			}
			return new Response("OK", { status: 200 });
		}

		return new Response("Not Found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
