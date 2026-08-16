import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { Urls } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    const url = await db.query.Urls.findFirst({
        where: eq(Urls.shortCode, code),
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
    return NextResponse.redirect(url.orginalUrl, 302);
}