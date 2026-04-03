import type { ParticipantJoinedData, ParticipantLeftData } from "./types";

type FetchFn = typeof fetch;

const TIMEOUT_MS = 5000;

export interface NotificationResult {
	ok: boolean;
}

function formatJstTime(isoTime: string): string {
	const date = new Date(isoTime);
	const jstHours = (date.getUTCHours() + 9) % 24;
	const hours = String(jstHours).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

function formatJoinedMessage(data: ParticipantJoinedData): string {
	return `[${data.meetingName}] に入室がありました（現在 ${data.participantCount} 名参加中）（${formatJstTime(data.joinTime)}）`;
}

function formatLeftMessage(
	meetingName: string,
	participantCount: number,
	leaveTime: string,
): string {
	return `[${meetingName}] から退室がありました（現在 ${participantCount} 名参加中）（${formatJstTime(leaveTime)}）`;
}

async function postToDiscord(
	webhookUrl: string,
	message: string,
	fetchFn: FetchFn,
): Promise<NotificationResult> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
		const response = await fetchFn(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: message,
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

export async function sendJoinedNotification(
	webhookUrl: string,
	data: ParticipantJoinedData,
	fetchFn: FetchFn = fetch,
): Promise<NotificationResult> {
	return postToDiscord(webhookUrl, formatJoinedMessage(data), fetchFn);
}

export async function sendLeftNotification(
	webhookUrl: string,
	meetingName: string,
	participantCount: number,
	data: ParticipantLeftData,
	fetchFn: FetchFn = fetch,
): Promise<NotificationResult> {
	return postToDiscord(
		webhookUrl,
		formatLeftMessage(meetingName, participantCount, data.leaveTime),
		fetchFn,
	);
}
