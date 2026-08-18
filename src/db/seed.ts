import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { v4 as uuid } from "uuid";

import { Users, Urls, Analytics } from "./schema";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
    console.log("🌱 Seeding database...");

    // Clear existing data
    await db.delete(Analytics);
    await db.delete(Urls);
    await db.delete(Users);

    // ------------------------
    // Users
    // ------------------------
    const [user1] = await db
        .insert(Users)
        .values({
            id: uuid(),
            name: "Shinas",
            email: "shinas@example.com",
            apiKey: "4a5413de3c326d2cdfca09e86cc90667c2f580fb25b1bfc6710d3bb283470cf7",
            emailVerified: true,
        })
        .returning();

    const [user2] = await db
        .insert(Users)
        .values({
            id: uuid(),
            name: "Demo User",
            email: "demo@example.com",
            apiKey: uuid(),
            emailVerified: true,
        })
        .returning();

    console.log("✅ Users created (including default frontend API key user)");

    // ------------------------
    // URLs
    // ------------------------
    const url1Id = uuid();
    const url2Id = uuid();
    const url3Id = uuid();
    const url4Id = uuid();

    await db
        .insert(Urls)
        .values([
            {
                id: url1Id,
                shortCode: "google1",
                orginalUrl: "https://google.com",
                userId: user1.id,
            },
            {
                id: url2Id,
                shortCode: "github2",
                orginalUrl: "https://github.com",
                password: "1234",
                userId: user1.id,
            },
            {
                id: url3Id,
                shortCode: "nextjs3",
                orginalUrl: "https://nextjs.org",
                userId: user1.id,
                expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            {
                id: url4Id,
                shortCode: "drizzle4",
                orginalUrl: "https://orm.drizzle.team",
                userId: user2.id,
            },
        ])
        .returning();

    console.log("✅ URLs created (regular, password-protected, and expiring)");

    // ------------------------
    // Analytics
    // ------------------------
    await db.insert(Analytics).values([
        {
            id: uuid(),
            urlId: url1Id,
            country: "IN",
            device: "Desktop",
            referer: "https://google.com",
        },
        {
            id: uuid(),
            urlId: url1Id,
            country: "US",
            device: "Mobile",
            referer: "https://x.com",
        },
        {
            id: uuid(),
            urlId: url1Id,
            country: "DE",
            device: "Desktop",
            referer: "direct",
        },
        {
            id: uuid(),
            urlId: url2Id,
            country: "GB",
            device: "Tablet",
            referer: "https://linkedin.com",
        },
        {
            id: uuid(),
            urlId: url2Id,
            country: "US",
            device: "Desktop",
            referer: "https://github.com",
        },
        {
            id: uuid(),
            urlId: url3Id,
            country: "JP",
            device: "Mobile",
            referer: "https://reddit.com",
        },
    ]);

    console.log("✅ Analytics records created");
    console.log("🎉 Database seeded successfully!");
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
    });