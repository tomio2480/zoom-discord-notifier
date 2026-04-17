// NOTE: KV は最終整合性のため並行リクエストでデータが失われる可能性がある。
// 数値カウンタではなく参加者 ID のセットで管理することで、再接続時の
// 重複カウント（join が stale な値を読んで increment してしまう問題）を防ぐ。
// expirationTtl により meeting.ended が届かなかった場合でも古いデータが残らない。
//
// TODO: 異なる参加者 ID の同時 join / leave では、双方が stale な読み取りを元に
// 書き戻すことで一方の更新が失われる lost update が依然として発生しうる。
// 抜本対策としては Durable Objects によるシリアライズ、もしくは
// compare-and-set 的なリトライの導入を検討する（無料プランの制約あり）。

const PARTICIPANTS_TTL_SECONDS = 86400; // 24 時間

async function getParticipants(kv: KVNamespace, meetingId: string): Promise<Set<string>> {
	const value = await kv.get(`participants:${meetingId}`);
	if (value === null) return new Set();
	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) {
			return new Set(parsed.filter((item): item is string => typeof item === "string"));
		}
		console.warn(`participants:${meetingId} is not an array`, { type: typeof parsed });
	} catch (err) {
		console.warn(`failed to parse participants:${meetingId}`, err);
	}
	return new Set();
}

export async function addParticipant(
	kv: KVNamespace,
	meetingId: string,
	participantId: string,
): Promise<number> {
	const participants = await getParticipants(kv, meetingId);
	participants.add(participantId);
	// NOTE: 既存参加者でも put を実行して TTL をリフレッシュする。
	// 再接続が続くだけで新規参加者が来ない会議でも TTL 失効を防ぐため。
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
	// 不在参加者への leave（stale event や meeting.ended 後の event）は書き戻さない
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
