ALTER TABLE "profiles" RENAME COLUMN "monthly_usage_count" TO "remained_credits";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "plan" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "language" varchar(10) DEFAULT 'ja';--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "usage_reset_at";