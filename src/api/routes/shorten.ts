import { Hono } from "hono";
import { db } from "@/app/lib/db";
import { Urls, Users } from "@/db/schema";
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomBytes, randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";



const CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateCode(length = 7): string {
    const bytes = randomBytes(length);
    let code = "";

    for (let i = 0; i < length; i++) {
        code += CHARSET[bytes[i] % CHARSET.length];
    }

    return code;
}


export const shortenRoute = new Hono();

const shortenSchema = z.object({
    apiKey: z.string().min(4, { message: 'Not a valid api key' }),
    url: z.string().url({ message: 'enter a valid string' }),
    pass: z.string().optional(),
    expireAt: z.coerce.date().optional(),
});




shortenRoute.post('/', zValidator('json', shortenSchema), async (c) => {
    const { apiKey, url } = c.req.valid('json');

    const user = await db.query.Users.findFirst({ where: (Users, { eq }) => eq(Users.apiKey, apiKey) });
    if (!user) {
        return c.json({ error: 'Not a valid api key' });
    }
    const existingUrl = await db.query.Urls.findFirst({
        where: (urls) =>
            and(
                eq(urls.orginalUrl, url),
                eq(urls.userId, user.userId)
            ),
    });
    const baseUrl = new URL(c.req.url).origin;
    if (existingUrl) {
        return c.json(
            {
                id: existingUrl.id,
                shortCode: existingUrl.shortCode,
                originalUrl: url,
                shortUrl: `${baseUrl}/${existingUrl.shortCode}`,
            },
            201
        );
    }
    let shortCode = generateCode(7);
    while (await db.query.Urls.findFirst({ where: (urls, { eq }) => eq(urls.shortCode, shortCode) })) {
        shortCode = generateCode(7);
    }
    let uuid = randomUUID();
    await db.insert(Urls).values({ id: uuid, shortCode: shortCode, orginalUrl: url, userId: user.userId });

    return c.json(
        {
            id: uuid,
            shortCode,
            originalUrl: url,
            shortUrl: `${baseUrl}/${shortCode}`,
        },
        201
    );
});

export default shortenRoute