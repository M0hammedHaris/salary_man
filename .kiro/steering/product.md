---
inclusion: always
---

# Product Context: SalaryMan

SalaryMan is a personal finance management platform focused on proactive financial health optimization through multi-account tracking, intelligent automation, and comprehensive analytics.

## Core Product Principles

When implementing features, prioritize:
- **Proactive over Reactive**: Automate alerts and insights before users need to ask
- **Accuracy First**: Financial data must be precise and reliable
- **Multi-Account Visibility**: Users manage multiple financial accounts simultaneously
- **Security & Privacy**: Handle financial data with strict security measures

## Domain Model

### Account Types
- **Bank Accounts**: Checking, savings with real-time balance tracking
- **Credit Cards**: Track balances, credit limits, utilization percentages
- **Savings**: Goal-oriented accounts with milestone tracking
- **Investments**: Portfolio tracking (future expansion)

### Transaction Model
- All transactions belong to an account
- Categorized by type (income, expense, transfer)
- Support recurring payment detection
- Optional receipt attachments
- Decimal precision: 12 digits, 2 decimal places

### Alert System
- **Credit Utilization Thresholds**: 30%, 50%, 70%, 90%
- **Bill Reminders**: Configurable advance notice
- **Spending Anomalies**: Pattern-based detection
- User-configurable notification preferences

## Financial Data Handling Rules

### Currency
- Default: INR (Indian Rupees)
- Display format: ₹1,234.56
- Always use Decimal.js for calculations (never JavaScript number arithmetic)
- Store as `numeric(12, 2)` in database

### Precision Requirements
- Never round during calculations
- Round only for display
- Maintain audit trail for all financial operations
- Balance calculations must be deterministic and reproducible

### Date Handling
- Default format: MM/dd/yyyy
- Use date-fns for all date operations
- Store timestamps in UTC
- Display in user's timezone

## Feature Implementation Guidelines

### Analytics & Reporting
- Category breakdowns by time period
- Cash flow forecasting based on historical patterns
- Financial health scores (composite metrics)
- Comparison widgets (month-over-month, year-over-year)
- Net worth tracking across all accounts

### Savings Goals
- Progress tracking with visual indicators
- Milestone notifications
- Projected completion dates
- Support multiple concurrent goals

### User Experience
- Mobile-responsive design (mobile-first approach)
- Real-time updates where possible
- Optimistic UI updates with rollback on error
- Loading states for all async operations
- Error boundaries for graceful degradation

## Security & Privacy

- Authentication via Clerk (never implement custom auth)
- All financial data scoped to authenticated user
- No sharing of financial data between users
- Audit logs for sensitive operations
- Input validation on all user-provided data (use Zod schemas)

## Business Rules

### Account Management
- Users can have unlimited accounts
- Each account must have a unique name per user
- Account deletion requires confirmation
- Soft delete for data retention

### Transaction Rules
- Transactions cannot be orphaned (must belong to account)
- Transfer transactions affect two accounts
- Recurring transactions auto-generate based on schedule
- Transaction edits create audit trail

### Alert Rules
- Alerts fire once per condition per day (no spam)
- Users can snooze or dismiss alerts
- Alert history retained for 90 days
- Critical alerts (90% credit utilization) cannot be disabled

## Target User Context

Users are individuals who:
- Manage 2-5 financial accounts on average
- Need detailed expense tracking for budgeting
- Want automated reminders to avoid late fees
- Seek insights for better financial decisions
- Value data accuracy over speed

## Future Expansion Considerations

When implementing features, consider:
- Multi-currency support (future)
- Bank API integrations (future)
- Shared accounts/family features (future)
- Investment portfolio tracking (future)
- Tax reporting exports (future)
