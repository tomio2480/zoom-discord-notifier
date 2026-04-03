import { describe, expect, it } from "vitest";
import { handleUrlValidation } from "../src/url-validation";

const SECRET_TOKEN = "test_secret_token";

describe("handleUrlValidation", () => {
	it("plainToken と encryptedToken を含むレスポンスを返す", () => {
		const plainToken = "abc123";
		const result = handleUrlValidation(plainToken, SECRET_TOKEN);

		expect(result.plainToken).toBe(plainToken);
		expect(result.encryptedToken).toMatch(/^[a-f0-9]{64}$/);
	});

	it("正しい HMAC-SHA256 値を生成する", () => {
		const result = handleUrlValidation("abc123", SECRET_TOKEN);
		expect(result.encryptedToken).toBe(
			"e2c017c3c4ec55bd4c10b2dfb2f8b18be1f89294aa6cba86070fac35292fb106",
		);
	});

	it("同じ入力に対して同じ encryptedToken を返す", () => {
		const plainToken = "abc123";
		const result1 = handleUrlValidation(plainToken, SECRET_TOKEN);
		const result2 = handleUrlValidation(plainToken, SECRET_TOKEN);

		expect(result1.encryptedToken).toBe(result2.encryptedToken);
	});

	it("異なる plainToken に対して異なる encryptedToken を返す", () => {
		const result1 = handleUrlValidation("token1", SECRET_TOKEN);
		const result2 = handleUrlValidation("token2", SECRET_TOKEN);

		expect(result1.encryptedToken).not.toBe(result2.encryptedToken);
	});
});
