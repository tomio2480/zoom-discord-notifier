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
	joinTime: string;
	participantCount: number;
}

export interface ParticipantLeftData {
	meetingName: string;
	leaveTime: string;
	participantCount: number;
}

export interface MeetingEndedData {
	meetingName: string;
	endTime: string;
}

export interface MeetingEndedData {
	meetingName: string;
	endTime: string;
}
