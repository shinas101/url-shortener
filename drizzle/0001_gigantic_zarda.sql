CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"apiKey" varchar NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "urls" RENAME COLUMN "shortCode" TO "short_code";--> statement-breakpoint
ALTER TABLE "urls" RENAME COLUMN "orginalUrl" TO "original_url";--> statement-breakpoint
ALTER TABLE "urls" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "urls" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "urls" RENAME COLUMN "expireAt" TO "expire_at";--> statement-breakpoint
ALTER TABLE "analytics" DROP CONSTRAINT "analytics_id_unique";--> statement-breakpoint
ALTER TABLE "urls" DROP CONSTRAINT "urls_id_unique";--> statement-breakpoint
ALTER TABLE "analytics" DROP CONSTRAINT "analytics_urlId_urls_id_fk";
--> statement-breakpoint
ALTER TABLE "urls" DROP CONSTRAINT "urls_userId_users_userId_fk";
--> statement-breakpoint
ALTER TABLE "analytics" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "analytics" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "analytics" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "urls" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "urls" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "urls" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics" ADD COLUMN "url_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urls" ADD CONSTRAINT "urls_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" DROP COLUMN "urlId";--> statement-breakpoint
ALTER TABLE "urls" ADD CONSTRAINT "urls_short_code_unique" UNIQUE("short_code");