import { db } from "@/app/lib/db";
import { Analytics } from "@/db/schema";

/**
 * In-memory IP-to-Country cache to avoid duplicate lookups.
 */
const ipCountryCache = new Map<string, string>();

/**
 * Safe helper to retrieve a header value from Request, Headers, ReadonlyHeaders, or plain objects.
 */
function getHeader(reqOrHeaders: unknown, name: string): string | null {
    if (!reqOrHeaders) return null;

    const lowerName = name.toLowerCase();

    // 1. Direct .get() method (Headers, ReadonlyHeaders, Map, URLSearchParams)
    const asGet = reqOrHeaders as { get?: (k: string) => string | null };
    if (typeof asGet.get === "function") {
        return asGet.get(name) ?? asGet.get(lowerName) ?? null;
    }

    // 2. Request-like object with .headers
    const asReq = reqOrHeaders as { headers?: unknown };
    if (asReq.headers) {
        const h = asReq.headers as { get?: (k: string) => string | null; [k: string]: unknown };
        if (typeof h.get === "function") {
            return h.get(name) ?? h.get(lowerName) ?? null;
        }
        if (typeof h === "object" && h !== null) {
            const val = (h as Record<string, unknown>)[name] ?? (h as Record<string, unknown>)[lowerName];
            return typeof val === "string" ? val : null;
        }
    }

    // 3. Plain header dictionary { 'user-agent': '...' }
    if (typeof reqOrHeaders === "object" && reqOrHeaders !== null) {
        const dict = reqOrHeaders as Record<string, unknown>;
        const val = dict[name] ?? dict[lowerName];
        return typeof val === "string" ? val : null;
    }

    return null;
}

/**
 * Parses user agent string to determine the device category.
 */
export function parseDevice(ua: string | null): "Desktop" | "Mobile" | "Tablet" | "Bot" {
    if (!ua) return "Desktop";
    const lower = ua.toLowerCase();

    if (/bot|crawler|spider|crawling|slurp|curl|wget|postman/i.test(lower)) {
        return "Bot";
    }
    if (/ipad|tablet|(android(?!.*mobile))/i.test(lower)) {
        return "Tablet";
    }
    if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(lower)) {
        return "Mobile";
    }
    return "Desktop";
}

/**
 * Parses user agent string to detect the Operating System.
 */
export function parseOS(ua: string | null): string {
    if (!ua) return "Unknown";
    const lower = ua.toLowerCase();

    if (/iphone|ipad|ipod/i.test(lower)) return "iOS";
    if (/android/i.test(lower)) return "Android";
    if (/windows/i.test(lower)) return "Windows";
    if (/macintosh|mac os x/i.test(lower)) return "macOS";
    if (/cros/i.test(lower)) return "ChromeOS";
    if (/linux/i.test(lower)) return "Linux";
    return "Other";
}

/**
 * Parses the HTTP Referer header to extract a clean source/domain name.
 */
export function parseReferer(ref: string | null): string {
    if (!ref || ref.trim() === "" || ref === "about:blank") {
        return "Direct";
    }

    try {
        const url = new URL(ref);
        let hostname = url.hostname.toLowerCase().replace(/^www\./, "");

        if (hostname.includes("google.")) return "Google";
        if (hostname.includes("twitter.com") || hostname.includes("t.co") || hostname.includes("x.com")) return "X / Twitter";
        if (hostname.includes("linkedin.com") || hostname.includes("lnkd.in")) return "LinkedIn";
        if (hostname.includes("facebook.com") || hostname.includes("fb.com")) return "Facebook";
        if (hostname.includes("instagram.com")) return "Instagram";
        if (hostname.includes("reddit.com")) return "Reddit";
        if (hostname.includes("github.com")) return "GitHub";
        if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "YouTube";

        return hostname || "Direct";
    } catch {
        return "Direct";
    }
}

/**
 * Extracts client IP address from proxy / reverse-proxy request headers.
 */
export function extractClientIp(reqOrHeaders: unknown): string | null {
    const forwardedFor = getHeader(reqOrHeaders, "x-forwarded-for");
    if (forwardedFor) {
        const ip = forwardedFor.split(",")[0].trim();
        if (ip) return ip;
    }
    const realIp = getHeader(reqOrHeaders, "x-real-ip");
    if (realIp) return realIp.trim();

    const cfIp = getHeader(reqOrHeaders, "cf-connecting-ip");
    if (cfIp) return cfIp.trim();

    return null;
}

/**
 * Resolves 2-letter Country code:
 * 1. Checks CDN/Proxy Edge headers (Cloudflare, Vercel, CloudFront).
 * 2. Falls back to cached IP lookup with non-blocking timeout.
 */
export async function extractCountry(reqOrHeaders: unknown): Promise<string | null> {
    const cdnCountry =
        getHeader(reqOrHeaders, "cf-ipcountry") ||
        getHeader(reqOrHeaders, "x-vercel-ip-country") ||
        getHeader(reqOrHeaders, "cloudfront-viewer-country") ||
        getHeader(reqOrHeaders, "x-country-code") ||
        getHeader(reqOrHeaders, "x-country");

    if (cdnCountry && cdnCountry !== "XX" && cdnCountry.length <= 3) {
        return cdnCountry.toUpperCase();
    }

    const ip = extractClientIp(reqOrHeaders);
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
        return null;
    }

    if (ipCountryCache.has(ip)) {
        return ipCountryCache.get(ip) || null;
    }

    try {
        const res = await fetch(`https://api.country.is/${ip}`, {
            signal: AbortSignal.timeout(1000),
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.country && typeof data.country === "string") {
                const code = data.country.toUpperCase();
                ipCountryCache.set(ip, code);
                return code;
            }
        }
    } catch {
        // Silently fallback if IP lookup is unreachable
    }

    return null;
}

/**
 * Records a click event in the Analytics table.
 * Wrapped in try/catch so analytics logging never fails the redirect request.
 */
export async function recordClick(urlId: string, reqOrHeaders: unknown): Promise<void> {
    try {
        const userAgent = getHeader(reqOrHeaders, "user-agent") || null;
        const refererHeader = getHeader(reqOrHeaders, "referer") || getHeader(reqOrHeaders, "referrer") || null;

        const device = parseDevice(userAgent);
        const os = parseOS(userAgent);
        const referer = parseReferer(refererHeader);
        const country = await extractCountry(reqOrHeaders);

        await db.insert(Analytics).values({
            urlId,
            device,
            os,
            referer,
            userAgent: userAgent ? userAgent.substring(0, 500) : null,
            country: country ? country.substring(0, 2) : null,
        });
    } catch (error) {
        console.error("Failed to record analytics click:", error);
    }
}
