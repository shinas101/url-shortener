import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { Urls, Analytics } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import client from "@/app/lib/redis";
import { generateShortCode, isValidCustomCode } from "@/app/lib/utils";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userLinks = await db
            .select({
                id: Urls.id,
                shortCode: Urls.shortCode,
                originalUrl: Urls.orginalUrl,
                hasPassword: sql<boolean>`CASE WHEN ${Urls.password} IS NOT NULL AND ${Urls.password} != '' THEN true ELSE false END`,
                createdAt: Urls.createdAt,
                expireAt: Urls.expireAt,
                clicks: sql<number>`count(${Analytics.id})::int`,
            })
            .from(Urls)
            .leftJoin(Analytics, eq(Urls.id, Analytics.urlId))
            .where(eq(Urls.userId, session.user.id))
            .groupBy(Urls.id)
            .orderBy(desc(Urls.createdAt));

        return NextResponse.json({ links: userLinks });
    } catch (error) {
        console.error("Failed to fetch user links:", error);
        return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { url, customCode, password, expireAt } = body;

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "Valid URL is required" }, { status: 400 });
        }

        let shortCode = customCode?.trim();

        if (shortCode) {
            if (!isValidCustomCode(shortCode)) {
                return NextResponse.json(
                    { error: "Custom short code must be 3-20 alphanumeric characters" },
                    { status: 400 }
                );
            }
            const existing = await db.query.Urls.findFirst({
                where: (urls, { eq }) => eq(urls.shortCode, shortCode),
            });
            if (existing) {
                return NextResponse.json({ error: "Custom short code already taken" }, { status: 409 });
            }
        } else {
            shortCode = generateShortCode();
            while (
                await db.query.Urls.findFirst({
                    where: (urls, { eq }) => eq(urls.shortCode, shortCode),
                })
            ) {
                shortCode = generateShortCode();
            }
        }

        const linkId = randomUUID();
        await db.insert(Urls).values({
            id: linkId,
            shortCode,
            orginalUrl: url,
            password: password ? String(password) : null,
            userId: session.user.id,
            expireAt: expireAt ? new Date(expireAt) : null,
        });

        // Cache in Redis for unpassworded links
        if (!password) {
            await client.set(
                `url:${shortCode}`,
                JSON.stringify({
                    id: linkId,
                    originalUrl: url,
                    hasPassword: false,
                }),
                { EX: 60 * 60 }
            );
        }

        return NextResponse.json(
            {
                id: linkId,
                shortCode,
                originalUrl: url,
                hasPassword: Boolean(password),
                createdAt: new Date().toISOString(),
                clicks: 0,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create short link:", error);
        return NextResponse.json({ error: "Failed to create short link" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const linkId = searchParams.get("id");

        if (!linkId) {
            return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
        }

        const link = await db.query.Urls.findFirst({
            where: (urls, { and, eq }) => and(eq(urls.id, linkId), eq(urls.userId, session.user.id)),
        });

        if (!link) {
            return NextResponse.json({ error: "Link not found or unauthorized" }, { status: 404 });
        }

        await client.del(`url:${link.shortCode}`);
        await db.delete(Urls).where(and(eq(Urls.id, linkId), eq(Urls.userId, session.user.id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete link:", error);
        return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
    }
}
