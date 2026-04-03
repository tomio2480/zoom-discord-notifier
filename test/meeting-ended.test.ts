import { describe, expect, it } from "vitest";
import { parseMeetingEnded } from "../src/meeting-ended";

describe("parseMeetingEnded", () => {
	it("ペイロードからミーティング名と終了時刻を取り出す", () => {
		const payload = {
			event: "meeting.ended",
			payload: {
				object: {
					topic: "テストミーティング",
					end_time: "2026-04-03T12:00:00Z",
				},
			},
		};

		const result = parseMeetingEnded(payload);
		expect(result).toEqual({
			meetingName: "テストミーティング",
			endTime: "2026-04-03T12:00:00Z",
		});
	});

	it("イベントが meeting.ended でない場合は null を返す", () => {
		const payload = { event: "meeting.started", payload: { object: { topic: "test" } } };
		expect(parseMeetingEnded(payload)).toBeNull();
	});

	it("payload.object が欠けている場合は null を返す", () => {
		const payload = { event: "meeting.ended", payload: {} };
		expect(parseMeetingEnded(payload)).toBeNull();
	});

	it("end_time が不正な日時フォーマットの場合は null を返す", () => {
		const payload = {
			event: "meeting.ended",
			payload: {
				object: {
					topic: "テスト",
					end_time: "invalid-date",
				},
			},
		};
		expect(parseMeetingEnded(payload)).toBeNull();
	});

	it("null を渡した場合は null を返す", () => {
		expect(parseMeetingEnded(null)).toBeNull();
	});
});
