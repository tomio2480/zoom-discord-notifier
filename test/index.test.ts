import { describe, expect, it } from "vitest";

describe("Worker", () => {
	it("エクスポートが存在する", async () => {
		const worker = await import("../src/index");
		expect(worker.default).toBeDefined();
		expect(worker.default.fetch).toBeDefined();
	});
});
