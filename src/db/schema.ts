import { integer, pgTable, varchar, uuid, timestamp, text } from "drizzle-orm/pg-core";
import { Relation } from "drizzle-orm";


export const Users = pgTable("users", {
    userId: integer().primaryKey().generatedAlwaysAsIdentity().unique(),
    name: varchar().notNull(),
    apiKey: varchar().notNull().unique(),
});

export const Urls = pgTable("urls", {
    id: uuid().unique(),
    shortCode: varchar({ length: 10 }).notNull(),
    orginalUrl: varchar().notNull(),
    password: varchar(),
    userId: integer()
        .notNull()
        .references(() => Users.userId),
    createdAt: timestamp().notNull().defaultNow(),
    expireAt: timestamp(),
});

export const Analytics = pgTable("analytics", {
    id: uuid().unique(),
    urlId: uuid()
        .notNull()
        .references(() => Urls.id),
    country: varchar({ length: 2 }),
    device: varchar({ length: 20 }),
    referrer: text(),
});