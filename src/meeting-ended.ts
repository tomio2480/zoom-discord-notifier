import type { MeetingEndedData } from "./types";

export function parseMeetingEnded(payload: unknown): MeetingEndedData | null {
	if (typeof payload !== "object" || payload === null) return null;

	const p = payload as {
		event?: unknown;
		payload?: {
			object?: {
				topic?: unknown;
				end_time?: unknown;
			};
		};
	};

	if (p.event !== "meeting.ended") return null;

	const meetingName = p.payload?.object?.topic;
	const endTime = p.payload?.object?.end_time;

	if (typeof meetingName !== "string" || typeof endTime !== "string") {
		return null;
	}
	if (Number.isNaN(Date.parse(endTime))) {
		return null;
	}

	return { meetingName, endTime };
}
