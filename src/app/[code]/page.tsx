import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/app/lib/db";
import client from "@/app/lib/redis";
import { recordClick } from "@/app/lib/analytics";
import { RESERVED_ROUTES } from "@/app/lib/utils";

export default async function ShortCodeRedirectPage({
    params,
}: {
    params: Promise<{ code: string }>;
}) {
    const { code } = await params;

    // 1. Guard against reserved application routes
    if (!code || RESERVED_ROUTES.has(code.toLowerCase())) {
        notFound();
    }

    const reqHeaders = await headers();

    // 2. Check Redis cache
    let cached: string | null = null;
    try {
        cached = await client.get(`url:${code}`);
    } catch (err) {
        console.error("Failed to get cached link from Redis:", err);
    }

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === "object" && parsed.originalUrl) {
                if (parsed.hasPassword) {
                    redirect(`/unlock/${code}`);
                }
                if (parsed.id) {
                    await recordClick(parsed.id, reqHeaders);
                }
                redirect(parsed.originalUrl);
            }
        } catch (err) {
            // Re-throw Next.js redirects
            if (err && typeof err === "object" && "digest" in err) {
                throw err;
            }
            // Fall through to database lookup
        }
    }

    // 3. Query Database
    const url = await db.query.Urls.findFirst({
        where: (urls, { eq }) => eq(urls.shortCode, code),
    });

    // 4. Handle non-existent or expired URLs
    if (!url) {
        notFound();
    }

    if (url.expireAt && new Date(url.expireAt) < new Date()) {
        try {
            await client.del(`url:${code}`);
        } catch (err) {
            console.error("Failed to delete expired key from Redis:", err);
        }
        notFound();
    }

    // 5. Handle password-protected URLs
    if (url.password) {
        redirect(`/unlock/${code}`);
    }

    // 6. Cache in Redis
    try {
        await client.set(
            `url:${url.shortCode}`,
            JSON.stringify({
                id: url.id,
                originalUrl: url.orginalUrl,
                hasPassword: false,
            }),
            { EX: 60 * 60 }
        );
    } catch (err) {
        console.error("Failed to cache link in Redis:", err);
    }

    // 7. Record analytics click
    await recordClick(url.id, reqHeaders);

    // 8. Perform redirect
    redirect(url.orginalUrl);
}
