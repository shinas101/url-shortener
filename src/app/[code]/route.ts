import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import client from "../lib/redis";
import { recordClick } from "../lib/analytics";
import { RESERVED_ROUTES } from "../lib/utils";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    // 1. Guard against reserved application routes
    if (!code || RESERVED_ROUTES.has(code.toLowerCase())) {
        notFound();
    }

    // 2. Check Redis cache
    const cached = await client.get(`url:${code}`);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === "object" && parsed.originalUrl) {
                if (parsed.hasPassword) {
                    return NextResponse.redirect(new URL(`/unlock/${code}`, req.url));
                }
                if (parsed.id) {
                    await recordClick(parsed.id, req);
                }
                return NextResponse.redirect(parsed.originalUrl, 302);
            }
        } catch {
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
        await client.del(`url:${code}`);
        notFound();
    }

    // 5. Handle password-protected URLs
    if (url.password) {
        return NextResponse.redirect(new URL(`/unlock/${code}`, req.url));
    }

    // 6. Cache valid unpassworded metadata in Redis
    await client.set(
        `url:${url.shortCode}`,
        JSON.stringify({
            id: url.id,
            originalUrl: url.orginalUrl,
            hasPassword: false,
        }),
        { EX: 60 * 60 }
    );

    // 7. Record analytics click
    await recordClick(url.id, req);

    return NextResponse.redirect(url.orginalUrl, 302);
}