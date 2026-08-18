import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/app/lib/db";
import * as schema from "@/db/schema";

const isProduction = process.env.NODE_ENV === "production";
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const betterAuthUrl = process.env.BETTER_AUTH_URL || vercelUrl || "http://localhost:3000";

export const auth = betterAuth({
    baseURL: betterAuthUrl,
    trustedOrigins: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://urlshortener-beta-five.vercel.app",
        ...(betterAuthUrl ? [betterAuthUrl] : []),
        ...(vercelUrl ? [vercelUrl] : []),
        ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.Users,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                  google: {
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  },
              }
            : {}),
    },
});