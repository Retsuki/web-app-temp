CREATE TYPE "public"."sample_billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."sample_payment_status" AS ENUM('paid', 'failed', 'pending', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."sample_plan" AS ENUM('free', 'indie', 'pro');--> statement-breakpoint
CREATE TYPE "public"."sample_project_status" AS ENUM('active', 'archived', 'completed');--> statement-breakpoint
CREATE TYPE "public"."sample_subscription_status" AS ENUM('active', 'past_due', 'canceled', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."sample_webhook_status" AS ENUM('pending', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sample_payment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"stripe_invoice_id" varchar(255) NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'jpy' NOT NULL,
	"status" "sample_payment_status" NOT NULL,
	"description" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"payment_method" varchar(50),
	"last4" varchar(4),
	"brand" varchar(20),
	"refunded_amount" integer DEFAULT 0,
	"refunded_at" timestamp,
	"refund_reason" text,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sample_payment_history_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sample_plan_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan" "sample_plan" NOT NULL,
	"monthly_usage_limit" integer NOT NULL,
	"projects_limit" integer NOT NULL,
	"members_per_project_limit" integer NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"monthly_price" integer NOT NULL,
	"yearly_price" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sample_plan_limits_plan_unique" UNIQUE("plan")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sample_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "sample_project_status" DEFAULT 'active' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"priority" integer DEFAULT 0 NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sample_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" varchar(255) NOT NULL,
	"stripe_price_id" varchar(255) NOT NULL,
	"stripe_product_id" varchar(255) NOT NULL,
	"plan" "sample_plan" NOT NULL,
	"status" "sample_subscription_status" NOT NULL,
	"billing_cycle" "sample_billing_cycle" NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"cancel_reason" text,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sample_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sample_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"api_version" varchar(50),
	"payload" jsonb NOT NULL,
	"object_id" varchar(255),
	"object_type" varchar(50),
	"status" "sample_webhook_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0,
	"event_created_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sample_webhook_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sample_payment_history" ADD CONSTRAINT "sample_payment_history_subscription_id_sample_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."sample_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_payment_history_user_id_idx" ON "sample_payment_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_payment_history_subscription_id_idx" ON "sample_payment_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_payment_history_status_idx" ON "sample_payment_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_payment_history_created_at_idx" ON "sample_payment_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_projects_user_id_idx" ON "sample_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_projects_status_idx" ON "sample_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_projects_created_at_idx" ON "sample_projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_subscriptions_user_id_idx" ON "sample_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_subscriptions_status_idx" ON "sample_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_subscriptions_plan_idx" ON "sample_subscriptions" USING btree ("plan");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_webhook_events_event_type_idx" ON "sample_webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_webhook_events_status_idx" ON "sample_webhook_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sample_webhook_events_object_id_idx" ON "sample_webhook_events" USING btree ("object_id");