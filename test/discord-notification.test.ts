import { describe, expect, it, vi } from "vitest";
import { sendDiscordNotification } from "../src/discord-notification";
import type { ParticipantJoinedData } from "../src/types";

describe("sendDiscordNotification", () => {
	it("Discord Webhook に正しいメッセージを POST する", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
		const webhookUrl = "https://discord.com/api/webhooks/test/token";
		const data: ParticipantJoinedData = {
			meetingName: "週次定例",
			participantName: "田中太郎",
			joinTime: "2026-04-03T10:30:00Z",
		};

		const result = await sendDiscordNotification(webhookUrl, data, mockFetch);

		expect(result.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledOnce();

		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toBe(webhookUrl);
		expect(options.method).toBe("POST");
		expect(options.headers["Content-Type"]).toBe("application/json");

		const body = JSON.parse(options.body);
		expect(body.content).toBe("[週次定例] に 田中太郎 が入室しました（19:30）");
		expect(body.allowed_mentions).toEqual({ parse: [] });
	});

	it("UTC 15:00 以降の時刻を JST で正しく日跨ぎ変換する", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
		const data: ParticipantJoinedData = {
			meetingName: "夜間会議",
			participantName: "鈴木一郎",
			joinTime: "2026-04-03T15:30:00Z",
		};

		await sendDiscordNotification("https://discord.com/api/webhooks/test/token", data, mockFetch);

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.content).toBe("[夜間会議] に 鈴木一郎 が入室しました（00:30）");
	});

	it("POST 失敗時に ok: false を返す", async () => {
		const mockFetch = vi.fn().mockResolvedValue(new Response("error", { status: 500 }));
		const data: ParticipantJoinedData = {
			meetingName: "test",
			participantName: "test",
			joinTime: "2026-04-03T10:00:00Z",
		};

		const result = await sendDiscordNotification(
			"https://discord.com/api/webhooks/test/token",
			data,
			mockFetch,
		);

		expect(result.ok).toBe(false);
	});

	it("ネットワークエラー時に ok: false を返す", async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
		const data: ParticipantJoinedData = {
			meetingName: "test",
			participantName: "test",
			joinTime: "2026-04-03T10:00:00Z",
		};

		const result = await sendDiscordNotification(
			"https://discord.com/api/webhooks/test/token",
			data,
			mockFetch,
		);

		expect(result.ok).toBe(false);
	});
});
