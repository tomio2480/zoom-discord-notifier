import type { ParticipantJoinedData, ZoomWebhookPayload } from "./types";

export function parseParticipantJoined(payload: ZoomWebhookPayload): ParticipantJoinedData | null {
	if (payload.event !== "meeting.participant_joined") {
		return null;
	}

	return {
		meetingName: payload.payload.object.topic,
		participantName: payload.payload.object.participant.user_name,
		joinTime: payload.payload.object.participant.join_time,
	};
}
