CREATE INDEX "alert_settings_user_account_idx" ON "alert_settings" USING btree ("user_id","account_id");--> statement-breakpoint
CREATE INDEX "alert_settings_type_enabled_idx" ON "alert_settings" USING btree ("alert_type","is_enabled");--> statement-breakpoint
CREATE INDEX "alerts_user_triggered_idx" ON "alerts" USING btree ("user_id","triggered_at");--> statement-breakpoint
CREATE INDEX "alerts_account_status_idx" ON "alerts" USING btree ("account_id","status");--> statement-breakpoint
CREATE INDEX "alerts_status_triggered_idx" ON "alerts" USING btree ("status","triggered_at");