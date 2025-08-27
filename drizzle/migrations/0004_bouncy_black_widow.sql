CREATE TYPE "public"."bill_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."alert_type" ADD VALUE 'bill_reminder_1_day';--> statement-breakpoint
ALTER TYPE "public"."alert_type" ADD VALUE 'bill_reminder_3_day';--> statement-breakpoint
ALTER TYPE "public"."alert_type" ADD VALUE 'bill_reminder_7_day';--> statement-breakpoint
ALTER TYPE "public"."alert_type" ADD VALUE 'bill_reminder_14_day';--> statement-breakpoint
ALTER TABLE "recurring_payments" ADD COLUMN "status" "bill_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_payments" ADD COLUMN "payment_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recurring_payments" ADD COLUMN "reminder_days" text DEFAULT '1,3,7' NOT NULL;