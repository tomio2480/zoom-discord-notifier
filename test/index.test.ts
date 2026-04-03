import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import worker from "../src/index";

const env = {
	ZOOM_SECRET_TOKEN: "test_secret",
	ZOOM_WEBHOOK_SECRET_TOKEN: "test_webhook_secret",
	DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/test",
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

	it("plainToken がない場合に 400 を返す", async () => {
		const request = new Request("http://localhost/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				event: "endpoint.url_validation",
				payload: {},
			}),
		});
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
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

	it("不正な署名のリクエストに 401 を返す", async () => {
		const request = new Request("http://localhost/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-zm-signature": "v0=invalid",
				"x-zm-request-timestamp": String(Math.floor(Date.now() / 1000)),
			},
			body: JSON.stringify({ event: "meeting.participant_joined" }),
		});
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(401);
	});

	it("正しい署名の未知イベントに 404 を返す", async () => {
		const body = JSON.stringify({ event: "unknown.event" });
		const request = createSignedRequest(body);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(404);
	});
});
