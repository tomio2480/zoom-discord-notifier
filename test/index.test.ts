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

describe("Worker", () => {
	it("GET リクエストに 405 を返す", async () => {
		const request = new Request("http://localhost/", { method: "GET" });
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(405);
	});

	it("endpoint.url_validation に正しく応答する", async () => {
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
		expect(body.encryptedToken).toBeTypeOf("string");
		expect(body.encryptedToken.length).toBeGreaterThan(0);
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

	it("未知のイベントに 404 を返す", async () => {
		const request = new Request("http://localhost/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event: "unknown.event" }),
		});
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(404);
	});
});
