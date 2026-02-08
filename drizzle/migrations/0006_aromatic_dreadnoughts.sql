DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_status') THEN
        CREATE TYPE "public"."goal_status" AS ENUM('active', 'paused', 'completed', 'cancelled');
    END IF;
END $$;
CREATE TABLE "goal_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"milestone_percentage" numeric(5, 2) NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"achieved_amount" numeric(12, 2),
	"achieved_at" timestamp with time zone,
	"is_achieved" boolean DEFAULT false NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_progress_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"previous_amount" numeric(12, 2) NOT NULL,
	"new_amount" numeric(12, 2) NOT NULL,
	"change_amount" numeric(12, 2) NOT NULL,
	"account_balance" numeric(12, 2) NOT NULL,
	"progress_percentage" numeric(5, 2) NOT NULL,
	"transaction_id" uuid,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"alert_id" uuid,
	"notification_type" text NOT NULL,
	"channel" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'sent',
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"alert_type" text NOT NULL,
	"email_enabled" boolean DEFAULT true,
	"push_enabled" boolean DEFAULT true,
	"in_app_enabled" boolean DEFAULT true,
	"sms_enabled" boolean DEFAULT false,
	"frequency_limit" numeric(10, 0),
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"timezone" text DEFAULT 'UTC',
	"emergency_override" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"target_amount" numeric(12, 2) NOT NULL,
	"current_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"target_date" timestamp with time zone NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"priority" numeric(3, 0) DEFAULT '5' NOT NULL,
	"initial_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "delivery_channels" text[] DEFAULT '{"inApp"}';--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "delivery_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "priority" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "goal_milestones" ADD CONSTRAINT "goal_milestones_goal_id_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_milestones" ADD CONSTRAINT "goal_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_progress_history" ADD CONSTRAINT "goal_progress_history_goal_id_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_progress_history" ADD CONSTRAINT "goal_progress_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_progress_history" ADD CONSTRAINT "goal_progress_history_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_milestones_goal_percentage_idx" ON "goal_milestones" USING btree ("goal_id","milestone_percentage");--> statement-breakpoint
CREATE INDEX "goal_milestones_achieved_idx" ON "goal_milestones" USING btree ("is_achieved","achieved_at");--> statement-breakpoint
CREATE INDEX "goal_progress_history_goal_recorded_idx" ON "goal_progress_history" USING btree ("goal_id","recorded_at");--> statement-breakpoint
CREATE INDEX "goal_progress_history_user_recorded_idx" ON "goal_progress_history" USING btree ("user_id","recorded_at");--> statement-breakpoint
CREATE INDEX "notification_history_user_sent_idx" ON "notification_history" USING btree ("user_id","sent_at");--> statement-breakpoint
CREATE INDEX "notification_history_alert_idx" ON "notification_history" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "notification_history_channel_status_idx" ON "notification_history" USING btree ("channel","status");--> statement-breakpoint
CREATE INDEX "notification_preferences_user_type_idx" ON "notification_preferences" USING btree ("user_id","alert_type");--> statement-breakpoint
CREATE INDEX "notification_preferences_unique_user_type" ON "notification_preferences" USING btree ("user_id","alert_type");--> statement-breakpoint
CREATE INDEX "savings_goals_user_status_idx" ON "savings_goals" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "savings_goals_target_date_idx" ON "savings_goals" USING btree ("target_date");--> statement-breakpoint
CREATE INDEX "savings_goals_priority_idx" ON "savings_goals" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "alerts_delivery_status_idx" ON "alerts" USING btree ("delivery_status","delivered_at");--> statement-breakpoint
CREATE INDEX "alerts_priority_triggered_idx" ON "alerts" USING btree ("priority","triggered_at");--> statement-breakpoint
CREATE INDEX "alerts_read_archived_idx" ON "alerts" USING btree ("read_at","archived_at");