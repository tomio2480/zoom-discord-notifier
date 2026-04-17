import { deriveParticipantId } from "./participant-id";

export interface ParsedJoinEvent {
	meetingName: string;
	joinTime: string;
	participantId: string;
}

export function parseParticipantJoined(payload: unknown): ParsedJoinEvent | null {
	if (typeof payload !== "object" || payload === null) return null;

	const p = payload as {
		event?: unknown;
		payload?: {
			object?: {
				topic?: unknown;
				participant?: {
					participant_user_id?: unknown;
					user_id?: unknown;
					user_name?: unknown;
					join_time?: unknown;
				};
			};
		};
	};

	if (p.event !== "meeting.participant_joined") return null;

	const meetingName = p.payload?.object?.topic;
	const participant = p.payload?.object?.participant;
	const joinTime = participant?.join_time;

	if (typeof meetingName !== "string" || typeof joinTime !== "string" || !participant) {
		return null;
	}

	const participantId = deriveParticipantId(participant);
	if (!participantId) return null;

	return { meetingName, joinTime, participantId };
}
