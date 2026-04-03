export interface ParsedJoinEvent {
	meetingName: string;
	joinTime: string;
}

export function parseParticipantJoined(payload: unknown): ParsedJoinEvent | null {
	if (typeof payload !== "object" || payload === null) return null;

	const p = payload as {
		event?: unknown;
		payload?: {
			object?: {
				topic?: unknown;
				participant?: { join_time?: unknown };
			};
		};
	};

	if (p.event !== "meeting.participant_joined") return null;

	const meetingName = p.payload?.object?.topic;
	const joinTime = p.payload?.object?.participant?.join_time;

	if (typeof meetingName !== "string" || typeof joinTime !== "string") {
		return null;
	}

	return { meetingName, joinTime };
}
