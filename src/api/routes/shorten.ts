import { Hono } from "hono";
import { db } from "@/app/lib/db";
import { Urls } from "@/db/schema";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { randomUUID } from "crypto";
import client from "@/app/lib/redis";
import { auth } from "@/app/lib/auth";
import { generateShortCode } from "@/app/lib/utils";

export const shortenRoute = new Hono();

const shortenSchema = z.object({
    apiKey: z.string().optional(),
    url: z.string().url({ message: "Enter a valid URL" }),
    pass: z.string().optional(),
    expireAt: z.coerce.date().optional(),
});

shortenRoute.post("/", zValidator("json", shortenSchema), async (c) => {
    const { apiKey, url, pass, expireAt } = c.req.valid("json");

    let userId: string | null = null;

    try {
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });
        if (session?.user?.id) {
            userId = session.user.id;
        }
    } catch {
        // Guest user fallback
    }

    if (!userId && apiKey) {
        const user = await db.query.Users.findFirst({
            where: (users, { eq }) => eq(users.apiKey, apiKey),
        });
        if (user) {
            userId = user.id;
        }
    }

    const baseUrl = new URL(c.req.url).origin;

    // Generate unique short code
    let shortCode = generateShortCode();
    while (
        await db.query.Urls.findFirst({
            where: (urls, { eq }) => eq(urls.shortCode, shortCode),
        })
    ) {
        shortCode = generateShortCode();
    }

    const uuid = randomUUID();
    const hasPassword = Boolean(pass && pass.trim().length > 0);
    const cleanPassword = hasPassword ? pass!.trim() : null;

    await db.insert(Urls).values({
        id: uuid,
        shortCode,
        orginalUrl: url,
        userId,
        password: cleanPassword,
        expireAt: expireAt || null,
    });

    // Cache unpassworded links in Redis for fast direct redirects
    if (!hasPassword) {
        await client.set(
            `url:${shortCode}`,
            JSON.stringify({
                id: uuid,
                originalUrl: url,
                hasPassword: false,
            }),
            { EX: 60 * 60 }
        );
    }

    return c.json(
        {
            id: uuid,
            shortCode,
            originalUrl: url,
            hasPassword,
            shortUrl: `${baseUrl}/${shortCode}`,
        },
        201
    );
});

export default shortenRoute;