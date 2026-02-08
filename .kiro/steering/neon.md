---
inclusion: always
---

# Neon Database Guidelines

## Overview

SalaryMan uses NeonDB (serverless Postgres) as its primary database. This guide covers Neon-specific operations, database branching workflows, and integration patterns.

**Key Capabilities:**
- Database branching for safe schema changes and testing
- Serverless Postgres with autoscaling
- SQL execution and performance analysis
- Schema inspection and migration workflows

## Integration with Drizzle ORM

SalaryMan uses Drizzle ORM as the primary interface to Neon. Use Neon tools directly only for:
- Database branching and testing
- Performance analysis and optimization
- Schema inspection across branches
- Direct SQL execution when Drizzle is insufficient

For standard CRUD operations, always use Drizzle through `src/lib/db/` and service layer.

## Neon Power Tool Access

Access Neon tools via the `kiroPowers` tool with action="use". Always activate the power first to see available tools.

**Activate Neon power:**
```
kiroPowers(action="activate", powerName="neon")
```

**Common tool patterns:**
- Branch operations: `create_branch`, `delete_branch`, `describe_branch`, `reset_from_parent`
- SQL execution: `run_sql`, `run_sql_transaction`, `explain_sql_statement`
- Schema inspection: `get_database_tables`, `describe_table_schema`
- Performance: `list_slow_queries`, `prepare_query_tuning`, `complete_query_tuning`
- Migrations: `prepare_database_migration`, `complete_database_migration`
- Connection: `get_connection_string`

Refer to power activation output for complete tool schemas and parameters.

## Common Workflows

### Safe Schema Migration

Use database branching to test schema changes before applying to production:

1. Create migration branch for testing
2. Apply migration SQL on branch
3. Verify schema changes
4. Apply to main branch if successful
5. Clean up test branch

Always use Drizzle's migration workflow (`npm run db:generate` → `npm run db:migrate`) for schema changes. Use Neon branching only for pre-production validation.

### Query Performance Optimization

When dashboard queries are slow:

1. Use `list_slow_queries` to identify bottlenecks
2. Use `explain_sql_statement` with `analyze: true` to see execution plan
3. Create test branch via `prepare_query_tuning`
4. Test index additions on branch
5. Verify performance improvement
6. Apply optimizations to main via `complete_query_tuning`

### Development Environment Setup

Create isolated dev branch for testing:

1. Create branch with descriptive name
2. Get connection string for branch
3. Add to `.env.local` as `DATABASE_URL_DEV`
4. Seed test data via `run_sql_transaction`
5. Test features without affecting production data

## SalaryMan Database Patterns

### Financial Data Types
- Money amounts: `NUMERIC(12, 2)` (never FLOAT/DOUBLE)
- Dates: `TIMESTAMP` with UTC storage
- User IDs: `VARCHAR(255)` (Clerk format)
- Categories: `VARCHAR(50)` with constraints

### Required Indexes
Analytics queries require indexes on:
- `transactions(account_id, date)` - for account history
- `transactions(user_id, category, date)` - for category breakdowns
- `accounts(user_id)` - for account listings
- `bills(user_id, due_date)` - for bill reminders

### Security Patterns
- All queries MUST filter by `user_id` from Clerk auth
- Use Row Level Security (RLS) policies for multi-tenant isolation
- Test RLS on branches before production deployment
- Never expose raw connection strings in client code

### Migration Strategy
1. Update schema in `src/lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Test on Neon branch (optional for risky changes)
4. Apply migration: `npm run db:migrate`
5. Update TypeScript types (auto-inferred from schema)

## Best Practices

- Test risky schema changes on branches before production
- Use `run_sql_transaction` for multi-statement operations
- Monitor `list_slow_queries` regularly for optimization opportunities
- Clean up old test branches to keep project organized
- Use `explain_sql_statement` to validate index usage
- Preserve important branch states with `preserveUnderName` before reset

## Troubleshooting

**Slow queries:** Use `explain_sql_statement` with `analyze: true` to identify missing indexes or inefficient query plans

**Migration conflicts:** Test on branch first, check for data conflicts (e.g., adding NOT NULL to nullable columns)

**Branch issues:** Use `reset_from_parent` to refresh stale dev branches, preserve state with `preserveUnderName` if needed

**Connection errors:** Verify project ID, check branch exists, ensure connection string in `.env.local`
