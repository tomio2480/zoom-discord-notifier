// NOTE: KV は最終整合性のため、並行リクエストでカウントが不正確になる可能性がある。
// Durable Objects を使えば原子的な操作が可能だが、無料プランに含まれないため
// KV を採用している。通知用途ではカウントの多少のずれは許容範囲とする。
export async function incrementCount(kv: KVNamespace, meetingId: string): Promise<number> {
	const current = await getCount(kv, meetingId);
	const next = current + 1;
	await kv.put(`count:${meetingId}`, String(next));
	return next;
}

export async function decrementCount(kv: KVNamespace, meetingId: string): Promise<number> {
	const current = await getCount(kv, meetingId);
	const next = Math.max(0, current - 1);
	await kv.put(`count:${meetingId}`, String(next));
	return next;
}

export async function getCount(kv: KVNamespace, meetingId: string): Promise<number> {
	const value = await kv.get(`count:${meetingId}`);
	if (value === null) return 0;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? 0 : parsed;
}

export async function resetCount(kv: KVNamespace, meetingId: string): Promise<void> {
	await kv.delete(`count:${meetingId}`);
}
