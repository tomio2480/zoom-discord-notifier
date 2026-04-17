/// <reference types="node" />
import { createHmac } from "node:crypto";

export interface UrlValidationResult {
	plainToken: string;
	encryptedToken: string;
}

export function handleUrlValidation(plainToken: string, secretToken: string): UrlValidationResult {
	const encryptedToken = createHmac("sha256", secretToken).update(plainToken).digest("hex");
	return { plainToken, encryptedToken };
}
