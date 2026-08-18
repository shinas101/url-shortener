import { db } from "@/app/lib/db";
import { Analytics } from "@/db/schema";
import client from "@/app/lib/redis";

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
 * Detects if the request is a speculative browser or Next.js router prefetch.
 */
export function isPrefetch(reqOrHeaders: unknown): boolean {
    const purpose =
        getHeader(reqOrHeaders, "purpose") ||
        getHeader(reqOrHeaders, "sec-purpose") ||
        getHeader(reqOrHeaders, "x-purpose");

    if (purpose && purpose.toLowerCase().includes("prefetch")) {
        return true;
    }

    const nextPrefetch = getHeader(reqOrHeaders, "next-router-prefetch");
    if (nextPrefetch === "1" || nextPrefetch === "true") {
        return true;
    }

    const secFetchDest = getHeader(reqOrHeaders, "sec-fetch-dest");
    if (secFetchDest === "image" || secFetchDest === "script") {
        return true;
    }

    return false;
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
 * Includes prefetch filtering and a 2-second Redis debounce lock
 * to prevent double-counting from browser pre-renders or duplicate requests.
 */
export async function recordClick(urlId: string, reqOrHeaders: unknown): Promise<void> {
    try {
        // 1. Skip speculative prefetch requests
        if (isPrefetch(reqOrHeaders)) {
            return;
        }

        const userAgent = getHeader(reqOrHeaders, "user-agent") || null;
        const ip = extractClientIp(reqOrHeaders) || "anon";

        // 2. 2-second Redis debounce lock per URL + visitor fingerprint
        const uaShort = userAgent ? userAgent.substring(0, 40) : "none";
        const lockKey = `click_lock:${urlId}:${ip}:${uaShort}`;

        try {
            const isNew = await client.set(lockKey, "1", { NX: true, EX: 2 });
            if (!isNew) {
                // Duplicate request arrived within 2 seconds
                return;
            }
        } catch {
            // If Redis lock check fails, proceed with record
        }

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
