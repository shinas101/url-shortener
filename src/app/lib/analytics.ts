import { db } from "@/app/lib/db";
import { Analytics } from "@/db/schema";

/**
 * In-memory IP-to-Country cache to avoid duplicate lookups.
 */
const ipCountryCache = new Map<string, string>();

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

        // Friendly domain names for common platforms
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
export function extractClientIp(req: Request): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const ip = forwardedFor.split(",")[0].trim();
        if (ip) return ip;
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();

    return null;
}

/**
 * Resolves 2-letter Country code:
 * 1. Checks CDN/Proxy Edge headers (Cloudflare, Vercel, CloudFront).
 * 2. Falls back to cached IP lookup with non-blocking timeout.
 */
export async function extractCountry(req: Request): Promise<string | null> {
    // 1. CDN / Edge headers (Instant, 0ms)
    const cdnCountry =
        req.headers.get("cf-ipcountry") ||
        req.headers.get("x-vercel-ip-country") ||
        req.headers.get("cloudfront-viewer-country") ||
        req.headers.get("x-country-code") ||
        req.headers.get("x-country");

    if (cdnCountry && cdnCountry !== "XX" && cdnCountry.length <= 3) {
        return cdnCountry.toUpperCase();
    }

    // 2. IP lookup for self-hosted / local environments
    const ip = extractClientIp(req);
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
        return null;
    }

    if (ipCountryCache.has(ip)) {
        return ipCountryCache.get(ip) || null;
    }

    try {
        const res = await fetch(`https://api.country.is/${ip}`, {
            signal: AbortSignal.timeout(1000), // 1-second max timeout so it never blocks
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
        // Silently fallback if IP service is unreachable
    }

    return null;
}

/**
 * Records a click event in the Analytics table.
 * Wrapped in try/catch so analytics logging never fails the redirect request.
 */
export async function recordClick(urlId: string, req: Request): Promise<void> {
    try {
        const userAgent = req.headers.get("user-agent") || null;
        const refererHeader = req.headers.get("referer") || req.headers.get("referrer") || null;

        const device = parseDevice(userAgent);
        const os = parseOS(userAgent);
        const referer = parseReferer(refererHeader);
        const country = await extractCountry(req);

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
