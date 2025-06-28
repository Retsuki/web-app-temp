ALTER TABLE "profiles" ADD COLUMN "avatar_url" varchar(500);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "deleted_at" timestamp;