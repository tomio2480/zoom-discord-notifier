import { describe, expect, it } from "vitest";
import {
	addParticipant,
	getCount,
	removeParticipant,
	resetParticipants,
} from "../src/participant-count";

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
	it("addParticipant は参加者を追加してカウントを返す", async () => {
		const kv = createMockKV();
		const count = await addParticipant(kv, "meeting-123", "user-a");
		expect(count).toBe(1);
	});

	it("addParticipant は異なる参加者を追加するとカウントが増える", async () => {
		const kv = createMockKV();
		await addParticipant(kv, "meeting-123", "user-a");
		await addParticipant(kv, "meeting-123", "user-b");
		const count = await addParticipant(kv, "meeting-123", "user-c");
		expect(count).toBe(3);
	});

	it("addParticipant は同じ参加者を重複追加してもカウントが増えない（再接続対策）", async () => {
		const kv = createMockKV();
		await addParticipant(kv, "meeting-123", "user-a");
		await addParticipant(kv, "meeting-123", "user-b");
		const count = await addParticipant(kv, "meeting-123", "user-a");
		expect(count).toBe(2);
	});

	it("removeParticipant は参加者を削除してカウントを返す", async () => {
		const kv = createMockKV();
		await addParticipant(kv, "meeting-123", "user-a");
		await addParticipant(kv, "meeting-123", "user-b");
		const count = await removeParticipant(kv, "meeting-123", "user-a");
		expect(count).toBe(1);
	});

	it("removeParticipant は存在しない参加者を削除しても 0 未満にならない", async () => {
		const kv = createMockKV();
		const count = await removeParticipant(kv, "meeting-123", "user-a");
		expect(count).toBe(0);
	});

	it("removeParticipant は同じ参加者を重複削除しても 0 未満にならない（冪等性）", async () => {
		const kv = createMockKV();
		await addParticipant(kv, "meeting-123", "user-a");
		await removeParticipant(kv, "meeting-123", "user-a");
		const count = await removeParticipant(kv, "meeting-123", "user-a");
		expect(count).toBe(0);
	});

	it("getCount は現在のカウントを返す", async () => {
		const kv = createMockKV();
		await addParticipant(kv, "meeting-123", "user-a");
		await addParticipant(kv, "meeting-123", "user-b");
		const count = await getCount(kv, "meeting-123");
		expect(count).toBe(2);
	});

	it("getCount は未設定時に 0 を返す", async () => {
		const kv = createMockKV();
		const count = await getCount(kv, "meeting-123");
		expect(count).toBe(0);
	});

	it("resetParticipants はカウントを 0 にリセットする", async () => {
		const kv = createMockKV();
		await addParticipant(kv, "meeting-123", "user-a");
		await addParticipant(kv, "meeting-123", "user-b");
		await resetParticipants(kv, "meeting-123");
		const count = await getCount(kv, "meeting-123");
		expect(count).toBe(0);
	});
});
