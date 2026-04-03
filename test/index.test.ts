import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

function createMockKV(): KVNamespace {
	const store = new Map<string, string>();
	return {
		get: async (key: string) => store.get(key) ?? null,
		put: async (key: string, value: string) => {
			store.set(key, value);
		},
		delete: async (key: string) => {
			store.delete(key);
		},
	} as unknown as KVNamespace;
}

const env = {
	ZOOM_SECRET_TOKEN: "test_secret",
	ZOOM_WEBHOOK_SECRET_TOKEN: "test_webhook_secret",
	DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/test",
	ZOOM_MEETING_ID: "123456789",
	PARTICIPANT_STORE: createMockKV(),
} as Env;

const ctx = {
	waitUntil: () => {},
	passThroughOnException: () => {},
} as unknown as ExecutionContext;

function createSignedRequest(body: string): Request {
	const timestamp = String(Math.floor(Date.now() / 1000));
	const message = `v0:${timestamp}:${body}`;
	const hash = createHmac("sha256", env.ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest("hex");
	return new Request("http://localhost/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-zm-signature": `v0=${hash}`,
			"x-zm-request-timestamp": timestamp,
		},
		body,
	});
}

describe("Worker", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 200 })));
		env.PARTICIPANT_STORE = createMockKV();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("GET リクエストに 405 を返す", async () => {
		const request = new Request("http://localhost/", { method: "GET" });
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(405);
	});

	it("endpoint.url_validation に正しく応答する（署名不要）", async () => {
		const request = new Request("http://localhost/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				event: "endpoint.url_validation",
				payload: { plainToken: "test_plain_token" },
			}),
		});
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json<{ plainToken: string; encryptedToken: string }>();
		expect(body.plainToken).toBe("test_plain_token");
		expect(body.encryptedToken).toMatch(/^[a-f0-9]{64}$/);
	});

	it("不正な JSON ボディに 400 を返す", async () => {
		const request = new Request("http://localhost/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "invalid json",
		});
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
	});

	it("署名がないリクエストに 401 を返す", async () => {
		const request = new Request("http://localhost/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event: "meeting.participant_joined" }),
		});
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(401);
	});

	it("ミーティング ID が欠落している場合は 400 を返す", async () => {
		const payload = {
			event: "meeting.participant_joined",
			payload: { object: { topic: "テスト" } },
		};
		const request = createSignedRequest(JSON.stringify(payload));
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
	});

	it("ミーティング ID が一致しない場合は 200 を返し通知しない", async () => {
		const payload = {
			event: "meeting.participant_joined",
			payload: {
				object: {
					id: 999999999,
					topic: "別のミーティング",
					participant: { user_name: "テスト", join_time: "2026-04-03T10:00:00Z" },
				},
			},
		};
		const request = createSignedRequest(JSON.stringify(payload));
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const mockFetch = vi.mocked(fetch);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("participant_joined で人数付き通知を送信し 200 を返す", async () => {
		const payload = {
			event: "meeting.participant_joined",
			payload: {
				object: {
					id: 123456789,
					topic: "テストミーティング",
					participant: { user_name: "田中太郎", join_time: "2026-04-03T10:00:00Z" },
				},
			},
		};
		const request = createSignedRequest(JSON.stringify(payload));
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const mockFetch = vi.mocked(fetch);
		expect(mockFetch).toHaveBeenCalledOnce();
		const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
		expect(body.content).toContain("現在 1 名参加中");
	});

	it("participant_left で人数付き退室通知を送信し 200 を返す", async () => {
		// まず 2 名入室させる
		for (let i = 0; i < 2; i++) {
			const joinPayload = {
				event: "meeting.participant_joined",
				payload: {
					object: {
						id: 123456789,
						topic: "テスト",
						participant: { user_name: `user${i}`, join_time: "2026-04-03T10:00:00Z" },
					},
				},
			};
			await worker.fetch(createSignedRequest(JSON.stringify(joinPayload)), env, ctx);
		}

		const leftPayload = {
			event: "meeting.participant_left",
			payload: {
				object: {
					id: 123456789,
					topic: "テスト",
					participant: { user_name: "user0", leave_time: "2026-04-03T11:00:00Z" },
				},
			},
		};
		const request = createSignedRequest(JSON.stringify(leftPayload));
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const mockFetch = vi.mocked(fetch);
		const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
		const body = JSON.parse(lastCall[1]?.body as string);
		expect(body.content).toContain("退室がありました");
		expect(body.content).toContain("現在 1 名参加中");
	});

	it("正しい署名の未知イベントに 404 を返す", async () => {
		const body = JSON.stringify({
			event: "unknown.event",
			payload: { object: { id: 123456789 } },
		});
		const request = createSignedRequest(body);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(404);
	});
});
