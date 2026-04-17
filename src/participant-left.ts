import { deriveParticipantId } from "./participant-id";

export interface ParsedLeftEvent {
	meetingName: string;
	leaveTime: string;
	participantId: string;
}

export function parseParticipantLeft(payload: unknown): ParsedLeftEvent | null {
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
					leave_time?: unknown;
				};
			};
		};
	};

	if (p.event !== "meeting.participant_left") return null;

	const meetingName = p.payload?.object?.topic;
	const participant = p.payload?.object?.participant;
	const leaveTime = participant?.leave_time;

	if (typeof meetingName !== "string" || typeof leaveTime !== "string" || !participant) {
		return null;
	}

	const participantId = deriveParticipantId(participant);
	if (!participantId) return null;

	return { meetingName, leaveTime, participantId };
}
