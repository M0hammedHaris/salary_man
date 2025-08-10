# Sprint Plan Draft: SalaryMan Foundation Sprint 1

## Sprint Goal
Deliver secure user authentication, database setup, and initial dashboard for SalaryMan, establishing the technical foundation for all future features.

## Sprint Duration
2 weeks (August 11–August 25, 2025)

## Deliverables
- Clerk authentication (sign up, login, logout, MFA, profile management)
- NeonDB PostgreSQL setup and Drizzle ORM integration
- Data models for users, accounts, transactions, categories
- Initial dashboard UI with Shadcn components and Tailwind CSS
- API routes for transaction CRUD
- Automated tests for authentication and data models
- Documentation updates (architecture, tech stack, change log)

## User Stories in Scope
1. Clerk authentication (Story 1)
2. NeonDB setup and data models (Story 2)
3. Dashboard UI (Story 3)
4. Transaction CRUD (Story 4)
5. Automated tests and documentation (Story 7)

## Sequence & Dependencies
- Start with Clerk authentication (required for user flows)
- Set up NeonDB and data models (required for dashboard and transactions)
- Build dashboard UI and transaction CRUD after backend is ready
- Write automated tests and update documentation throughout

## Acceptance Criteria
- Users can securely register, log in, log out, and manage profiles
- Database is operational and stores financial data reliably
- Dashboard displays accurate user/account/transaction data
- Transaction CRUD works with validation and immediate UI feedback
- All tests pass and documentation is updated

## Team & Roles

## Change Log
| Date       | Version | Description                | Author   |
|------------|---------|----------------------------|----------|
| 2025-08-10 | 1.0     | Sprint 1 plan draft created | Sarah (PO) |


**This sprint establishes the core foundation for SalaryMan and enables rapid iteration on future financial features.**
## Task Breakdown & Estimates

### Story 1: Clerk Authentication (5 points)
- Integrate Clerk SDK (2)
- Build signup/login/logout/profile forms (2)
- Implement MFA and session management (1)
- Owner: [Dev A]

### Story 2: NeonDB Setup & Data Models (5 points)
- Set up NeonDB and Drizzle ORM (2)
- Define models for users/accounts/transactions/categories (2)
- Seed initial data and test CRUD (1)
- Owner: [Dev B]

### Story 3: Dashboard UI (3 points)
- Build dashboard layout with Shadcn/Tailwind (1)
- Display account balances and recent transactions (1)
- Connect to backend for real-time data (1)
- Owner: [Dev A]

### Story 4: Transaction CRUD (4 points)
- Create API routes for add/edit/delete (2)
- Build frontend forms and validation (1)
- Implement optimistic UI updates (1)
- Owner: [Dev B]

### Story 7: Automated Tests & Documentation (3 points)
- Write unit/integration tests for auth and models (1)
- Add E2E tests for dashboard and transactions (1)
- Update architecture/docs/change log (1)
- Owner: [QA]

## Sprint Review & Retrospective
- Demo: Show authentication, dashboard, and transaction flows
- Review: Validate acceptance criteria for all stories
- Retrospective: Discuss what went well, blockers, and improvements for next sprint

---

**Sprint plan is now fully detailed and ready for kickoff.**
