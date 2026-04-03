import { describe, expect, it } from "vitest";
import { decrementCount, getCount, incrementCount, resetCount } from "../src/participant-count";

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

describe("participant-count", () => {
	it("incrementCount はカウントを 1 増やして返す", async () => {
		const kv = createMockKV();
		const count = await incrementCount(kv, "meeting-123");
		expect(count).toBe(1);
	});

	it("incrementCount は連続呼び出しでカウントを増やす", async () => {
		const kv = createMockKV();
		await incrementCount(kv, "meeting-123");
		await incrementCount(kv, "meeting-123");
		const count = await incrementCount(kv, "meeting-123");
		expect(count).toBe(3);
	});

	it("decrementCount はカウントを 1 減らして返す", async () => {
		const kv = createMockKV();
		await incrementCount(kv, "meeting-123");
		await incrementCount(kv, "meeting-123");
		const count = await decrementCount(kv, "meeting-123");
		expect(count).toBe(1);
	});

	it("decrementCount は 0 未満にならない", async () => {
		const kv = createMockKV();
		const count = await decrementCount(kv, "meeting-123");
		expect(count).toBe(0);
	});

	it("getCount は現在のカウントを返す", async () => {
		const kv = createMockKV();
		await incrementCount(kv, "meeting-123");
		await incrementCount(kv, "meeting-123");
		const count = await getCount(kv, "meeting-123");
		expect(count).toBe(2);
	});

	it("getCount は未設定時に 0 を返す", async () => {
		const kv = createMockKV();
		const count = await getCount(kv, "meeting-123");
		expect(count).toBe(0);
	});

	it("resetCount はカウントを 0 にリセットする", async () => {
		const kv = createMockKV();
		await incrementCount(kv, "meeting-123");
		await incrementCount(kv, "meeting-123");
		await resetCount(kv, "meeting-123");
		const count = await getCount(kv, "meeting-123");
		expect(count).toBe(0);
	});
});
