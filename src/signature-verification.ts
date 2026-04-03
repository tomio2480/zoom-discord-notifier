import { createHmac, timingSafeEqual } from "node:crypto";

const TIMESTAMP_TOLERANCE_SECONDS = 300;

export function verifySignature(
	signature: string,
	timestamp: string,
	body: string,
	secret: string,
): boolean {
	const now = Math.floor(Date.now() / 1000);
	const requestTime = Number.parseInt(timestamp, 10);
	if (Number.isNaN(requestTime) || Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE_SECONDS) {
		return false;
	}

	const message = `v0:${timestamp}:${body}`;
	const expectedSignature = `v0=${createHmac("sha256", secret).update(message).digest("hex")}`;

	if (signature.length !== expectedSignature.length) {
		return false;
	}
	return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
