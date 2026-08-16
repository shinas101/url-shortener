import { db } from "@/app/lib/db";
import { Urls } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const verifyPasswordRoute = new Hono();


const verifyPasswordSchema = z.object({
    code: z.string(),
    password: z.string(),
});

verifyPasswordRoute.post('/', zValidator('json', verifyPasswordSchema), async (c) => {
    const { code, password } = c.req.valid('json');

    const checkPass = await db.query.Urls.findFirst({
        where: (urls, { eq, and }) => and(eq(urls.shortCode, code), eq(urls.password, password))
    });
    if (!checkPass) {
        return c.json({ error: 'No URL found with this code or password' }, 403);
    }
    return c.json({ url: checkPass.orginalUrl }, 200);


}
)

export default verifyPasswordRoute;