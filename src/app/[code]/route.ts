import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import client from "../lib/redis";
import { recordClick } from "../lib/analytics";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    // Check Redis cache
    const cached = await client.get(`url:${code}`);
    if (cached) {
        try {
            // Check if cached as JSON metadata
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
            // Legacy plain string fallback
            if (typeof cached === "string" && cached.startsWith("http")) {
                const urlRecord = await db.query.Urls.findFirst({
                    where: (urls, { eq }) => eq(urls.shortCode, code),
                });
                if (urlRecord) {
                    await recordClick(urlRecord.id, req);
                    // Upgrade cache
                    await client.set(
                        `url:${code}`,
                        JSON.stringify({
                            id: urlRecord.id,
                            originalUrl: urlRecord.orginalUrl,
                            hasPassword: Boolean(urlRecord.password),
                        }),
                        { EX: 60 * 60 }
                    );
                }
                return NextResponse.redirect(cached, 302);
            }
        }
    }

    const url = await db.query.Urls.findFirst({
        where: (urls, { eq }) => eq(urls.shortCode, code),
    });

    if (!url) {
        return NextResponse.json(
            { error: "Short URL not found" },
            { status: 404 }
        );
    }

    if (url.password) {
        return NextResponse.redirect(
            new URL(`/unlock/${code}`, req.url)
        );
    }

    // Cache metadata in Redis for 1 hour
    await client.set(
        `url:${url.shortCode}`,
        JSON.stringify({
            id: url.id,
            originalUrl: url.orginalUrl,
            hasPassword: false,
        }),
        { EX: 60 * 60 }
    );

    // Record the analytics click event
    await recordClick(url.id, req);

    return NextResponse.redirect(url.orginalUrl, 302);
}