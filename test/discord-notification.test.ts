import { describe, expect, it, vi } from "vitest";
import { sendJoinedNotification, sendLeftNotification } from "../src/discord-notification";
import type { ParticipantJoinedData, ParticipantLeftData } from "../src/types";

describe("sendJoinedNotification", () => {
	it("入室メッセージを人数付きで POST する", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
		const data: ParticipantJoinedData = {
			meetingName: "週次定例",
			joinTime: "2026-04-03T10:30:00Z",
			participantCount: 3,
		};

		const result = await sendJoinedNotification(
			"https://discord.com/api/webhooks/test/token",
			data,
			mockFetch,
		);

		expect(result.ok).toBe(true);
		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.content).toBe("[週次定例] に入室がありました（現在 3 名参加中）（19:30）");
		expect(body.allowed_mentions).toEqual({ parse: [] });
	});

	it("UTC 15:00 以降の時刻を JST で正しく日跨ぎ変換する", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
		const data: ParticipantJoinedData = {
			meetingName: "夜間会議",
			joinTime: "2026-04-03T15:30:00Z",
			participantCount: 1,
		};

		await sendJoinedNotification("https://discord.com/api/webhooks/test/token", data, mockFetch);

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.content).toBe("[夜間会議] に入室がありました（現在 1 名参加中）（00:30）");
	});

	it("POST 失敗時に ok: false を返す", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("error", { status: 500 }));
		const data: ParticipantJoinedData = {
			meetingName: "test",
			joinTime: "2026-04-03T10:00:00Z",
			participantCount: 1,
		};

		const result = await sendJoinedNotification(
			"https://discord.com/api/webhooks/test/token",
			data,
			mockFetch,
		);

		expect(result.ok).toBe(false);
	});
});

describe("sendLeftNotification", () => {
	it("退室メッセージを人数付きで POST する", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
		const data: ParticipantLeftData = {
			meetingName: "週次定例",
			leaveTime: "2026-04-03T11:00:00Z",
		};

		const result = await sendLeftNotification(
			"https://discord.com/api/webhooks/test/token",
			"週次定例",
			2,
			data,
			mockFetch,
		);

		expect(result.ok).toBe(true);
		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.content).toBe("[週次定例] から退室がありました（現在 2 名参加中）（20:00）");
	});

	it("POST 失敗時に ok: false を返す", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("error", { status: 500 }));
		const data: ParticipantLeftData = {
			meetingName: "test",
			leaveTime: "2026-04-03T10:00:00Z",
		};

		const result = await sendLeftNotification(
			"https://discord.com/api/webhooks/test/token",
			"test",
			0,
			data,
			mockFetch,
		);

		expect(result.ok).toBe(false);
	});
});
