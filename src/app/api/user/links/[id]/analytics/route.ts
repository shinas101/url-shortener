import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { Urls, Analytics } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function getLastNDates(days: number): string[] {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: linkId } = await params;
        const userId = session.user.id;

        // 1. Verify link ownership
        const link = await db.query.Urls.findFirst({
            where: (urls, { and, eq }) => and(eq(urls.id, linkId), eq(urls.userId, userId)),
        });

        if (!link) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 });
        }

        // 2. Total Clicks
        const totalClicksRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Analytics)
            .where(eq(Analytics.urlId, linkId));
        const totalClicks = totalClicksRes[0]?.count || 0;

        // 3. Today Clicks (24h)
        const todayClicksRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Analytics)
            .where(
                and(
                    eq(Analytics.urlId, linkId),
                    sql`${Analytics.createdAt} >= NOW() - INTERVAL '24 HOURS'`
                )
            );
        const todayClicks = todayClicksRes[0]?.count || 0;

        // 4. Time Series (Last 7 Days)
        const timeSeriesRes = await db
            .select({
                date: sql<string>`TO_CHAR(${Analytics.createdAt}, 'YYYY-MM-DD')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .where(
                and(
                    eq(Analytics.urlId, linkId),
                    sql`${Analytics.createdAt} >= NOW() - INTERVAL '7 DAYS'`
                )
            )
            .groupBy(sql`TO_CHAR(${Analytics.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`TO_CHAR(${Analytics.createdAt}, 'YYYY-MM-DD')`);

        const timeSeriesMap = new Map(timeSeriesRes.map((r) => [r.date, r.count]));
        const timeSeries = getLastNDates(7).map((date) => ({
            date,
            count: timeSeriesMap.get(date) || 0,
        }));

        // 5. Device breakdown
        const devices = await db
            .select({
                device: sql<string>`COALESCE(${Analytics.device}, 'Desktop')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .where(eq(Analytics.urlId, linkId))
            .groupBy(sql`COALESCE(${Analytics.device}, 'Desktop')`)
            .orderBy(desc(sql`count(*)`));

        // 6. OS breakdown
        const os = await db
            .select({
                os: sql<string>`COALESCE(${Analytics.os}, 'Unknown')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .where(eq(Analytics.urlId, linkId))
            .groupBy(sql`COALESCE(${Analytics.os}, 'Unknown')`)
            .orderBy(desc(sql`count(*)`))
            .limit(6);

        // 7. Referrer breakdown
        const referrers = await db
            .select({
                referer: sql<string>`COALESCE(${Analytics.referer}, 'Direct')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .where(eq(Analytics.urlId, linkId))
            .groupBy(sql`COALESCE(${Analytics.referer}, 'Direct')`)
            .orderBy(desc(sql`count(*)`))
            .limit(6);

        // 8. Country breakdown
        const countries = await db
            .select({
                country: sql<string>`COALESCE(${Analytics.country}, 'Unknown')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .where(eq(Analytics.urlId, linkId))
            .groupBy(sql`COALESCE(${Analytics.country}, 'Unknown')`)
            .orderBy(desc(sql`count(*)`))
            .limit(6);

        // 9. Recent Clicks Log (Last 15)
        const recentClicks = await db
            .select({
                id: Analytics.id,
                createdAt: Analytics.createdAt,
                device: Analytics.device,
                os: Analytics.os,
                referer: Analytics.referer,
                country: Analytics.country,
            })
            .from(Analytics)
            .where(eq(Analytics.urlId, linkId))
            .orderBy(desc(Analytics.createdAt))
            .limit(15);

        return NextResponse.json({
            link: {
                id: link.id,
                shortCode: link.shortCode,
                originalUrl: link.orginalUrl,
                createdAt: link.createdAt,
                hasPassword: Boolean(link.password),
                expireAt: link.expireAt,
            },
            totalClicks,
            todayClicks,
            timeSeries,
            devices,
            os,
            referrers,
            countries,
            recentClicks,
        });
    } catch (error) {
        console.error("Failed to fetch link analytics:", error);
        return NextResponse.json({ error: "Failed to fetch link analytics" }, { status: 500 });
    }
}
