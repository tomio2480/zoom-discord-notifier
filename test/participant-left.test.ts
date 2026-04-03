import { describe, expect, it } from "vitest";
import { parseParticipantLeft } from "../src/participant-left";

describe("parseParticipantLeft", () => {
	it("ペイロードからミーティング名と退室時刻を取り出す", () => {
		const payload = {
			event: "meeting.participant_left",
			payload: {
				object: {
					topic: "テストミーティング",
					participant: {
						user_name: "田中太郎",
						leave_time: "2026-04-03T11:00:00Z",
					},
				},
			},
		};

		const result = parseParticipantLeft(payload);
		expect(result).toEqual({
			meetingName: "テストミーティング",
			leaveTime: "2026-04-03T11:00:00Z",
		});
	});

	it("イベントが meeting.participant_left でない場合は null を返す", () => {
		const payload = { event: "meeting.started", payload: { object: { topic: "test" } } };
		expect(parseParticipantLeft(payload)).toBeNull();
	});

	it("payload.object が欠けている場合は null を返す", () => {
		const payload = { event: "meeting.participant_left", payload: {} };
		expect(parseParticipantLeft(payload)).toBeNull();
	});

	it("leave_time が欠けている場合は null を返す", () => {
		const payload = {
			event: "meeting.participant_left",
			payload: {
				object: {
					topic: "test",
					participant: { user_name: "test" },
				},
			},
		};
		expect(parseParticipantLeft(payload)).toBeNull();
	});

	it("null を渡した場合は null を返す", () => {
		expect(parseParticipantLeft(null)).toBeNull();
	});
});
