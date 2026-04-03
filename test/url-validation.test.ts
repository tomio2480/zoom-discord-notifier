import { describe, expect, it } from "vitest";
import { handleUrlValidation } from "../src/url-validation";

const SECRET_TOKEN = "test_secret_token";

describe("handleUrlValidation", () => {
	it("plainToken と encryptedToken を含むレスポンスを返す", async () => {
		const plainToken = "abc123";
		const result = await handleUrlValidation(plainToken, SECRET_TOKEN);

		expect(result.plainToken).toBe(plainToken);
		expect(result.encryptedToken).toBeTypeOf("string");
		expect(result.encryptedToken.length).toBeGreaterThan(0);
	});

	it("同じ入力に対して同じ encryptedToken を返す", async () => {
		const plainToken = "abc123";
		const result1 = await handleUrlValidation(plainToken, SECRET_TOKEN);
		const result2 = await handleUrlValidation(plainToken, SECRET_TOKEN);

		expect(result1.encryptedToken).toBe(result2.encryptedToken);
	});

	it("異なる plainToken に対して異なる encryptedToken を返す", async () => {
		const result1 = await handleUrlValidation("token1", SECRET_TOKEN);
		const result2 = await handleUrlValidation("token2", SECRET_TOKEN);

		expect(result1.encryptedToken).not.toBe(result2.encryptedToken);
	});
});
