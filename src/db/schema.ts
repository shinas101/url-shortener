import { pgTable, text, timestamp, boolean, uuid, varchar } from "drizzle-orm/pg-core";

// --- Better Auth Tables ---

export const Users = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    apiKey: varchar("apiKey").$defaultFn(() => crypto.randomUUID()),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => Users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => Users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- URL Shortener Tables ---

export const Urls = pgTable("urls", {
    id: uuid("id").primaryKey().defaultRandom(),
    shortCode: varchar("short_code", { length: 10 }).notNull().unique(),
    orginalUrl: varchar("original_url").notNull(),
    password: varchar("password"),
    userId: text("user_id").references(() => Users.id, { onDelete: "cascade" }), // nullable for guests or required for users
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expireAt: timestamp("expire_at"),
});

export const Analytics = pgTable("analytics", {
    id: uuid("id").primaryKey().defaultRandom(),
    urlId: uuid("url_id")
        .notNull()
        .references(() => Urls.id, { onDelete: "cascade" }),
    country: varchar("country", { length: 2 }),
    device: varchar("device", { length: 20 }),
    referer: text("referer"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    os: text("os"),

});
