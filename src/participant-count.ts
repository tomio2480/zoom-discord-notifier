// NOTE: KV は最終整合性のため並行リクエストでデータが失われる可能性がある。
// 数値カウンタではなく参加者 ID のセットで管理することで、再接続時の
// 重複カウント（join が stale な値を読んで increment してしまう問題）を防ぐ。
// expirationTtl により meeting.ended が届かなかった場合でも古いデータが残らない。

const PARTICIPANTS_TTL_SECONDS = 86400; // 24 時間

async function getParticipants(kv: KVNamespace, meetingId: string): Promise<Set<string>> {
	const value = await kv.get(`participants:${meetingId}`);
	if (value === null) return new Set();
	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) return new Set(parsed.filter((item): item is string => typeof item === "string"));
	} catch {}
	return new Set();
}

export async function addParticipant(
	kv: KVNamespace,
	meetingId: string,
	participantId: string,
): Promise<number> {
	const participants = await getParticipants(kv, meetingId);
	if (participants.has(participantId)) {
		return participants.size;
	}
	participants.add(participantId);
	await kv.put(`participants:${meetingId}`, JSON.stringify([...participants]), {
		expirationTtl: PARTICIPANTS_TTL_SECONDS,
	});
	return participants.size;
}

export async function removeParticipant(
	kv: KVNamespace,
	meetingId: string,
	participantId: string,
): Promise<number> {
	const participants = await getParticipants(kv, meetingId);
	if (!participants.delete(participantId)) {
		return participants.size;
	}
	if (participants.size === 0) {
		await kv.delete(`participants:${meetingId}`);
	} else {
		await kv.put(`participants:${meetingId}`, JSON.stringify([...participants]), {
			expirationTtl: PARTICIPANTS_TTL_SECONDS,
		});
	}
	return participants.size;
}

export async function resetParticipants(kv: KVNamespace, meetingId: string): Promise<void> {
	await kv.delete(`participants:${meetingId}`);
}

export async function getCount(kv: KVNamespace, meetingId: string): Promise<number> {
	const participants = await getParticipants(kv, meetingId);
	return participants.size;
}
