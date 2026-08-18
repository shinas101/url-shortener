import { randomBytes } from "crypto";

export const RESERVED_ROUTES = new Set([
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
    "not-found",
    "docs",
    "dashboard",
    "login",
    "unlock",
    "api",
    "admin",
    "auth",
]);

const ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a cryptographically secure random short code.
 */
export function generateShortCode(length = 7): string {
    let code = "";
    do {
        const bytes = randomBytes(length);
        code = "";
        for (let i = 0; i < length; i++) {
            code += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
        }
    } while (RESERVED_ROUTES.has(code.toLowerCase()));

    return code;
}

/**
 * Validates custom alias format (3-20 alphanumeric characters, hyphens, underscores)
 * and ensures it does not conflict with reserved application routes.
 */
export function isValidCustomCode(code: string): boolean {
    if (!code || RESERVED_ROUTES.has(code.toLowerCase())) {
        return false;
    }
    return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
}
