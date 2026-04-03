import { createHmac } from "node:crypto";

export interface UrlValidationResult {
	plainToken: string;
	encryptedToken: string;
}

export async function handleUrlValidation(
	plainToken: string,
	secretToken: string,
): Promise<UrlValidationResult> {
	const encryptedToken = createHmac("sha256", secretToken).update(plainToken).digest("hex");
	return { plainToken, encryptedToken };
}
