import type { ParticipantJoinedData } from "./types";

export function parseParticipantJoined(payload: unknown): ParticipantJoinedData | null {
	if (typeof payload !== "object" || payload === null) return null;

	const p = payload as {
		event?: unknown;
		payload?: {
			object?: {
				topic?: unknown;
				participant?: { user_name?: unknown; join_time?: unknown };
			};
		};
	};

	if (p.event !== "meeting.participant_joined") return null;

	const meetingName = p.payload?.object?.topic;
	const participantName = p.payload?.object?.participant?.user_name;
	const joinTime = p.payload?.object?.participant?.join_time;

	if (
		typeof meetingName !== "string" ||
		typeof participantName !== "string" ||
		typeof joinTime !== "string"
	) {
		return null;
	}

	return { meetingName, participantName, joinTime };
}
