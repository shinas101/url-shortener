ALTER TABLE "analytics" RENAME COLUMN "referrer" TO "referer";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_apiKey_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "apiKey" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "analytics" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics" ADD COLUMN "os" text;