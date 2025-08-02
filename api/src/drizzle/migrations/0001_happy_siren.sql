ALTER TABLE "payment_history" ALTER COLUMN "currency" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "payment_history" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "payment_history" ALTER COLUMN "payment_method" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "payment_history" ALTER COLUMN "brand" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_cycle" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "object_type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "status" SET DATA TYPE varchar(20);--> statement-breakpoint
DROP TYPE "public"."billing_cycle";--> statement-breakpoint
DROP TYPE "public"."card_brand";--> statement-breakpoint
DROP TYPE "public"."currency";--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
DROP TYPE "public"."payment_status";--> statement-breakpoint
DROP TYPE "public"."stripe_object_type";--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
DROP TYPE "public"."webhook_event_status";