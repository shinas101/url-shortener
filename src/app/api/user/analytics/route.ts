import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { Urls, Analytics } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Helper to generate the last N dates in 'YYYY-MM-DD' format
function getLastNDates(days: number): string[] {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = session.user.id;

        // 1. Total Links count
        const linksCountRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Urls)
            .where(eq(Urls.userId, userId));
        const totalLinks = linksCountRes[0]?.count || 0;

        if (totalLinks === 0) {
            return NextResponse.json({
                summary: {
                    totalLinks: 0,
                    totalClicks: 0,
                    todayClicks: 0,
                    last7DaysClicks: 0,
                },
                timeSeries: getLastNDates(7).map((date) => ({ date, count: 0 })),
                devices: [],
                os: [],
                referrers: [],
                countries: [],
                topLinks: [],
            });
        }

        // 2. Total Clicks across all links
        const totalClicksRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(eq(Urls.userId, userId));
        const totalClicks = totalClicksRes[0]?.count || 0;

        // 3. Clicks in last 24 hours
        const todayClicksRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(
                and(
                    eq(Urls.userId, userId),
                    sql`${Analytics.createdAt} >= NOW() - INTERVAL '24 HOURS'`
                )
            );
        const todayClicks = todayClicksRes[0]?.count || 0;

        // 4. Clicks in last 7 days
        const last7DaysClicksRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(
                and(
                    eq(Urls.userId, userId),
                    sql`${Analytics.createdAt} >= NOW() - INTERVAL '7 DAYS'`
                )
            );
        const last7DaysClicks = last7DaysClicksRes[0]?.count || 0;

        // 5. Time Series (Last 7 Days)
        const timeSeriesRes = await db
            .select({
                date: sql<string>`TO_CHAR(${Analytics.createdAt}, 'YYYY-MM-DD')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(
                and(
                    eq(Urls.userId, userId),
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

        // 6. Device breakdown
        const devicesRes = await db
            .select({
                device: sql<string>`COALESCE(${Analytics.device}, 'Desktop')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(eq(Urls.userId, userId))
            .groupBy(sql`COALESCE(${Analytics.device}, 'Desktop')`)
            .orderBy(desc(sql`count(*)`));

        // 7. OS breakdown
        const osRes = await db
            .select({
                os: sql<string>`COALESCE(${Analytics.os}, 'Unknown')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(eq(Urls.userId, userId))
            .groupBy(sql`COALESCE(${Analytics.os}, 'Unknown')`)
            .orderBy(desc(sql`count(*)`))
            .limit(6);

        // 8. Referrer breakdown
        const referrersRes = await db
            .select({
                referer: sql<string>`COALESCE(${Analytics.referer}, 'Direct')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(eq(Urls.userId, userId))
            .groupBy(sql`COALESCE(${Analytics.referer}, 'Direct')`)
            .orderBy(desc(sql`count(*)`))
            .limit(6);

        // 9. Country breakdown
        const countriesRes = await db
            .select({
                country: sql<string>`COALESCE(${Analytics.country}, 'Unknown')`,
                count: sql<number>`count(*)::int`,
            })
            .from(Analytics)
            .innerJoin(Urls, eq(Analytics.urlId, Urls.id))
            .where(eq(Urls.userId, userId))
            .groupBy(sql`COALESCE(${Analytics.country}, 'Unknown')`)
            .orderBy(desc(sql`count(*)`))
            .limit(6);

        // 10. Top Performing Links
        const topLinksRes = await db
            .select({
                id: Urls.id,
                shortCode: Urls.shortCode,
                originalUrl: Urls.orginalUrl,
                clicks: sql<number>`count(${Analytics.id})::int`,
            })
            .from(Urls)
            .leftJoin(Analytics, eq(Urls.id, Analytics.urlId))
            .where(eq(Urls.userId, userId))
            .groupBy(Urls.id)
            .orderBy(desc(sql`count(${Analytics.id})`))
            .limit(5);

        return NextResponse.json({
            summary: {
                totalLinks,
                totalClicks,
                todayClicks,
                last7DaysClicks,
            },
            timeSeries,
            devices: devicesRes,
            os: osRes,
            referrers: referrersRes,
            countries: countriesRes,
            topLinks: topLinksRes,
        });
    } catch (error) {
        console.error("Failed to fetch user analytics:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
