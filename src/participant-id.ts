export function deriveParticipantId(participant: {
	participant_user_id?: unknown;
	user_id?: unknown;
	user_name?: unknown;
}): string | null {
	if (typeof participant.participant_user_id === "string" && participant.participant_user_id) {
		return participant.participant_user_id;
	}
	const userId = participant.user_id;
	if (userId !== undefined && userId !== null && String(userId) !== "0") {
		return String(userId);
	}
	if (typeof participant.user_name === "string" && participant.user_name) {
		return participant.user_name;
	}
	return null;
}
