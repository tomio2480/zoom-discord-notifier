import type { ParticipantLeftData } from "./types";

export function parseParticipantLeft(payload: unknown): ParticipantLeftData | null {
	if (typeof payload !== "object" || payload === null) return null;

	const p = payload as {
		event?: unknown;
		payload?: {
			object?: {
				topic?: unknown;
				participant?: { leave_time?: unknown };
			};
		};
	};

	if (p.event !== "meeting.participant_left") return null;

	const meetingName = p.payload?.object?.topic;
	const leaveTime = p.payload?.object?.participant?.leave_time;

	if (typeof meetingName !== "string" || typeof leaveTime !== "string") {
		return null;
	}

	return { meetingName, leaveTime };
}
