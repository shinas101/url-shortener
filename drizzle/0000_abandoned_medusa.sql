CREATE TABLE "analytics" (
	"id" uuid,
	"urlId" uuid NOT NULL,
	"country" varchar(2),
	"device" varchar(20),
	"referrer" text,
	CONSTRAINT "analytics_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "urls" (
	"id" uuid,
	"shortCode" varchar(10) NOT NULL,
	"orginalUrl" varchar NOT NULL,
	"password" varchar,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expireAt" timestamp,
	CONSTRAINT "urls_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"userId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_userId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"apiKey" varchar NOT NULL,
	CONSTRAINT "users_userId_unique" UNIQUE("userId"),
	CONSTRAINT "users_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_urlId_urls_id_fk" FOREIGN KEY ("urlId") REFERENCES "public"."urls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "urls" ADD CONSTRAINT "urls_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE no action ON UPDATE no action;