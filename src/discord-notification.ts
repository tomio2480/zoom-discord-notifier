import type { ParticipantJoinedData } from "./types";

type FetchFn = typeof fetch;

const TIMEOUT_MS = 5000;

export interface NotificationResult {
	ok: boolean;
}

function formatMessage(data: ParticipantJoinedData): string {
	const date = new Date(data.joinTime);
	const jstHours = (date.getUTCHours() + 9) % 24;
	const hours = String(jstHours).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	return `[${data.meetingName}] に ${data.participantName} が入室しました（${hours}:${minutes}）`;
}

export async function sendDiscordNotification(
	webhookUrl: string,
	data: ParticipantJoinedData,
	fetchFn: FetchFn = fetch,
): Promise<NotificationResult> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
		const response = await fetchFn(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: formatMessage(data),
				allowed_mentions: { parse: [] },
			}),
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		return { ok: response.ok };
	} catch {
		return { ok: false };
	}
}
