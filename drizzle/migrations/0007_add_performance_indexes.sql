-- Add missing performance indexes for common query patterns

-- Transactions: userId + transactionDate for date range queries
CREATE INDEX IF NOT EXISTS "transactions_user_date_idx" ON "transactions" USING btree ("user_id", "transaction_date");

-- Transactions: accountId + transactionDate for account history
CREATE INDEX IF NOT EXISTS "transactions_account_date_idx" ON "transactions" USING btree ("account_id", "transaction_date");

-- Accounts: userId + type for filtered account lists
CREATE INDEX IF NOT EXISTS "accounts_user_type_idx" ON "accounts" USING btree ("user_id", "type");

-- Transactions: categoryId for category-based queries
CREATE INDEX IF NOT EXISTS "transactions_category_idx" ON "transactions" USING btree ("category_id");

-- Recurring Payments: userId + nextDueDate for upcoming bills
CREATE INDEX IF NOT EXISTS "recurring_payments_user_due_date_idx" ON "recurring_payments" USING btree ("user_id", "next_due_date");

-- Recurring Payments: userId + isActive for active payment queries
CREATE INDEX IF NOT EXISTS "recurring_payments_user_active_idx" ON "recurring_payments" USING btree ("user_id", "is_active");
