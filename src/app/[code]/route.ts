import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import client from "../lib/redis";
import { recordClick } from "../lib/analytics";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    // 1. Check Redis cache
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

    // 2. Query Database
    const url = await db.query.Urls.findFirst({
        where: (urls, { eq }) => eq(urls.shortCode, code),
    });

    // 3. Handle non-existent or expired URLs
    if (!url) {
        return NextResponse.redirect(new URL("/not-found", req.url));
    }

    if (url.expireAt && new Date(url.expireAt) < new Date()) {
        await client.del(`url:${code}`);
        return NextResponse.redirect(new URL("/not-found", req.url));
    }

    // 4. Handle password-protected URLs
    if (url.password) {
        return NextResponse.redirect(new URL(`/unlock/${code}`, req.url));
    }

    // 5. Cache valid unpassworded metadata in Redis
    await client.set(
        `url:${url.shortCode}`,
        JSON.stringify({
            id: url.id,
            originalUrl: url.orginalUrl,
            hasPassword: false,
        }),
        { EX: 60 * 60 }
    );

    // 6. Record analytics click
    await recordClick(url.id, req);

    return NextResponse.redirect(url.orginalUrl, 302);
}