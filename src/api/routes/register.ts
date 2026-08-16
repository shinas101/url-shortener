import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { db } from '../../app/lib/db';
import { Users } from '@/db/schema';

const registerRoute = new Hono();

const registrationSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
});

registerRoute.post('/', zValidator('json', registrationSchema), async (c) => {
    const { username } = c.req.valid('json');
    const apiKey = randomBytes(32).toString('hex');

    const existing = await db.query.Users.findFirst({
        where: (users, { eq }) => eq(users.name, username),
    });

    if (existing) {
        return c.json({ error: 'Username already exists' }, 400);
    }

    await db.insert(Users).values({ name: username, apiKey });
    return c.json({ success: true, apiKey }, 201);
});

export default registerRoute;
