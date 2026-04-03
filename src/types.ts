export interface ZoomWebhookPayload {
	event: string;
	payload: {
		object: {
			topic: string;
			participant: {
				user_name: string;
				join_time: string;
			};
		};
	};
}

export interface ParticipantJoinedData {
	meetingName: string;
	participantName: string;
	joinTime: string;
}
