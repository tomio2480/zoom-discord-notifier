import type { ParticipantJoinedData } from "./types";

type FetchFn = typeof fetch;

export interface NotificationResult {
	ok: boolean;
}

function formatMessage(data: ParticipantJoinedData): string {
	const date = new Date(data.joinTime);
	const hours = String(date.getUTCHours() + 9).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	return `[${data.meetingName}] に ${data.participantName} が入室しました（${hours}:${minutes}）`;
}

export async function sendDiscordNotification(
	webhookUrl: string,
	data: ParticipantJoinedData,
	fetchFn: FetchFn = fetch,
): Promise<NotificationResult> {
	try {
		const response = await fetchFn(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: formatMessage(data) }),
		});
		return { ok: response.ok };
	} catch {
		return { ok: false };
	}
}
