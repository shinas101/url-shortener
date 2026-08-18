import { randomBytes } from "crypto";

const ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a cryptographically secure random short code.
 */
export function generateShortCode(length = 7): string {
    const bytes = randomBytes(length);
    let code = "";
    for (let i = 0; i < length; i++) {
        code += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
    }
    return code;
}

/**
 * Validates custom alias format (3-20 alphanumeric characters, hyphens, underscores).
 */
export function isValidCustomCode(code: string): boolean {
    return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
}
