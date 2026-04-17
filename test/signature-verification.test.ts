/// <reference types="node" />
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySignature } from "../src/signature-verification";

const SECRET = "test_webhook_secret";

function generateSignature(timestamp: string, body: string, secret: string): string {
	const message = `v0:${timestamp}:${body}`;
	const hash = createHmac("sha256", secret).update(message).digest("hex");
	return `v0=${hash}`;
}

describe("verifySignature", () => {
	it("正しい署名で true を返す", () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = '{"event":"meeting.participant_joined"}';
		const signature = generateSignature(timestamp, body, SECRET);

		expect(verifySignature(signature, timestamp, body, SECRET)).toBe(true);
	});

	it("不正な署名で false を返す", () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = '{"event":"meeting.participant_joined"}';

		expect(verifySignature("v0=invalid_signature", timestamp, body, SECRET)).toBe(false);
	});

	it("5分以上前のタイムスタンプで false を返す", () => {
		const oldTimestamp = String(Math.floor(Date.now() / 1000) - 301);
		const body = '{"event":"meeting.participant_joined"}';
		const signature = generateSignature(oldTimestamp, body, SECRET);

		expect(verifySignature(signature, oldTimestamp, body, SECRET)).toBe(false);
	});

	it("5分以上先の未来タイムスタンプで false を返す", () => {
		const futureTimestamp = String(Math.floor(Date.now() / 1000) + 301);
		const body = '{"event":"meeting.participant_joined"}';
		const signature = generateSignature(futureTimestamp, body, SECRET);

		expect(verifySignature(signature, futureTimestamp, body, SECRET)).toBe(false);
	});

	it("ちょうど5分以内のタイムスタンプで true を返す", () => {
		const timestamp = String(Math.floor(Date.now() / 1000) - 299);
		const body = '{"event":"meeting.participant_joined"}';
		const signature = generateSignature(timestamp, body, SECRET);

		expect(verifySignature(signature, timestamp, body, SECRET)).toBe(true);
	});
});
