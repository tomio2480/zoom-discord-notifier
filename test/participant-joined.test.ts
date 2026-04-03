import { describe, expect, it } from "vitest";
import { parseParticipantJoined } from "../src/participant-joined";

describe("parseParticipantJoined", () => {
	it("ペイロードから参加者名・ミーティング名・入室時刻を取り出す", () => {
		const payload = {
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
		};

		expect(parseParticipantJoined(payload)).toBeNull();
	});

	it("payload.object が欠けている場合は null を返す", () => {
		const payload = {
			event: "meeting.participant_joined",
			payload: {},
		};

		expect(parseParticipantJoined(payload)).toBeNull();
	});

	it("participant が欠けている場合は null を返す", () => {
		const payload = {
			event: "meeting.participant_joined",
			payload: { object: { topic: "test" } },
		};

		expect(parseParticipantJoined(payload)).toBeNull();
	});

	it("null を渡した場合は null を返す", () => {
		expect(parseParticipantJoined(null)).toBeNull();
	});
});
