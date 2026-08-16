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
    const [user] = await db
        .insert(Users)
        .values({
            name: "Shinas",
            apiKey: uuid(),
        })
        .returning();

    console.log("✅ User created");

    // ------------------------
    // URLs
    // ------------------------
    const url1Id = uuid();
    const url2Id = uuid();

    const urls = await db
        .insert(Urls)
        .values([
            {
                id: url1Id,
                shortCode: "abc123",
                orginalUrl: "https://google.com",
                userId: user.userId,
            },
            {
                id: url2Id,
                shortCode: "xyz789",
                orginalUrl: "https://github.com",
                password: "1234",
                userId: user.userId,
            },
        ])
        .returning();

    console.log("✅ URLs created");

    // ------------------------
    // Analytics
    // ------------------------
    await db.insert(Analytics).values([
        {
            id: uuid(),
            urlId: url1Id,
            country: "IN",
            device: "Desktop",
            referrer: "https://google.com",
        },
        {
            id: uuid(),
            urlId: url1Id,
            country: "US",
            device: "Mobile",
            referrer: "https://twitter.com",
        },
        {
            id: uuid(),
            urlId: url2Id,
            country: "GB",
            device: "Tablet",
            referrer: "https://linkedin.com",
        },
    ]);

    console.log("✅ Analytics created");
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