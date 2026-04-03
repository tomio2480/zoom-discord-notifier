import { describe, expect, it } from "vitest";
import { parseParticipantJoined } from "../src/participant-joined";
import type { ZoomWebhookPayload } from "../src/types";

describe("parseParticipantJoined", () => {
	it("ペイロードから参加者名・ミーティング名・入室時刻を取り出す", () => {
		const payload: ZoomWebhookPayload = {
			event: "meeting.participant_joined",
			payload: {
				object: {
					topic: "週次定例ミーティング",
					participant: {
						user_name: "田中太郎",
						join_time: "2026-04-03T10:00:00Z",
					},
				},
			},
		};

		const result = parseParticipantJoined(payload);
		expect(result).toEqual({
			meetingName: "週次定例ミーティング",
			participantName: "田中太郎",
			joinTime: "2026-04-03T10:00:00Z",
		});
	});

	it("イベントが meeting.participant_joined でない場合は null を返す", () => {
		const payload = {
			event: "meeting.started",
			payload: {
				object: {
					topic: "test",
					participant: { user_name: "test", join_time: "2026-04-03T10:00:00Z" },
				},
			},
		} as ZoomWebhookPayload;

		expect(parseParticipantJoined(payload)).toBeNull();
	});
});
