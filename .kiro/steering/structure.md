---
inclusion: always
---

# Project Structure & File Organization

## Critical File Placement Rules

When creating or modifying files, follow these strict placement rules:

### Components
- Feature components: `src/components/{feature}/` (e.g., `src/components/accounts/AccountList.tsx`)
- Shared UI primitives: `src/components/ui/` (Shadcn components only)
- Layout components: `src/components/layout/` (header, sidebar, navigation)
- Global providers: `src/components/providers.tsx`

### Pages & Routes
- App pages: `src/app/{route}/page.tsx` (e.g., `src/app/dashboard/page.tsx`)
- API endpoints: `src/app/api/{resource}/route.ts` (e.g., `src/app/api/accounts/route.ts`)
- Layouts: `src/app/{route}/layout.tsx`
- Loading states: `src/app/{route}/loading.tsx`
- Error boundaries: `src/app/{route}/error.tsx`

### Business Logic
- Server actions: `src/lib/actions/{feature}.ts` (e.g., `src/lib/actions/accounts.ts`)
- Services: `src/lib/services/{feature}-service.ts` (e.g., `src/lib/services/account-service.ts`)
- Database queries: Keep in service layer, never in components
- Utilities: `src/lib/utils/{category}.ts` or `src/lib/utils.ts` for shared helpers

### Data Layer
- Schema: `src/lib/db/schema.ts` (single source of truth)
- Database client: `src/lib/db/index.ts`
- Migrations: `drizzle/migrations/` (auto-generated, never edit manually)
- Type inference: Export types from schema using `InferSelectModel` and `InferInsertModel`

### Types
- Shared types: `src/lib/types/{domain}.ts` (e.g., `src/lib/types/account.ts`)
- Component-specific types: Co-locate in component file or adjacent `.types.ts` file
- API types: Define in route file or `src/lib/types/api.ts`

### Tests
- Mirror source structure: `src/__tests__/{path}/{file}.test.ts(x)`
- Example: Component at `src/components/accounts/AccountList.tsx` → Test at `src/__tests__/components/accounts/AccountList.test.tsx`
- Test utilities: `src/__tests__/utils/` or `src/__tests__/setup.ts`

### Hooks
- Custom hooks: `src/lib/hooks/{hook-name}.ts` (e.g., `src/lib/hooks/use-accounts.ts`)
- Always prefix with `use-` in kebab-case

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `AccountList.tsx`, `TransactionForm.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-currency.ts`, `calculate-balance.ts`)
- Services: `{feature}-service.ts` (e.g., `account-service.ts`, `transaction-service.ts`)
- Actions: `{feature}.ts` in actions folder (e.g., `src/lib/actions/accounts.ts`)
- Types: `{domain}.ts` or `{domain}-types.ts` (e.g., `account.ts`, `transaction-types.ts`)
- Tests: `{source-file}.test.ts(x)` (e.g., `AccountList.test.tsx`)
- API routes: `route.ts` (Next.js convention)
- Hooks: `use-{name}.ts` (e.g., `use-accounts.ts`, `use-transaction-form.ts`)

## Import Path Rules

ALWAYS use `@/` alias for imports from `src/`:
```typescript
// Correct
import { db } from '@/lib/db'
import { AccountList } from '@/components/accounts/AccountList'
import { formatCurrency } from '@/lib/utils/format-currency'

// Wrong - never use relative paths
import { db } from '../../lib/db'
import { AccountList } from '../components/accounts/AccountList'
```

Import order:
1. External packages (React, Next.js, third-party)
2. `@/` imports (grouped by type: components, lib, types)
3. Relative imports (only for same-directory files)
4. Type imports (use `import type` when possible)

## Component Organization Patterns

### Feature Component Structure
```
src/components/{feature}/
├── {Feature}List.tsx          # List/index view
├── {Feature}Form.tsx          # Create/edit form
├── {Feature}Card.tsx          # Display card
├── {Feature}Details.tsx       # Detail view
└── {feature}-utils.ts         # Feature-specific utilities
```

### Page Component Structure
```
src/app/{route}/
├── page.tsx                   # Main page component (Server Component)
├── layout.tsx                 # Layout wrapper (if needed)
├── loading.tsx                # Loading state
├── error.tsx                  # Error boundary
└── _components/               # Page-specific components (prefix with _)
    └── {Component}.tsx
```

## API Route Organization

Structure API routes by resource:
```
src/app/api/
├── accounts/
│   ├── route.ts               # GET /api/accounts, POST /api/accounts
│   └── [id]/
│       └── route.ts           # GET/PUT/DELETE /api/accounts/:id
├── transactions/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
└── analytics/
    ├── overview/
    │   └── route.ts           # GET /api/analytics/overview
    └── trends/
        └── route.ts           # GET /api/analytics/trends
```

Each `route.ts` exports named functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`

## Service Layer Pattern

Abstract database operations through services:

```typescript
// src/lib/services/account-service.ts
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function getAccountsByUserId(userId: string) {
  return db.select().from(accounts).where(eq(accounts.userId, userId))
}

export async function createAccount(data: InsertAccount) {
  return db.insert(accounts).values(data).returning()
}
```

Use services in:
- API routes for data fetching
- Server actions for mutations
- Server components for initial data

Never call database directly from components or pages.

## Database Schema Organization

Single schema file at `src/lib/db/schema.ts`:

```typescript
// Define tables
export const accounts = pgTable('accounts', { ... })
export const transactions = pgTable('transactions', { ... })

// Define relations
export const accountsRelations = relations(accounts, ({ many }) => ({ ... }))

// Export types
export type Account = InferSelectModel<typeof accounts>
export type InsertAccount = InferInsertModel<typeof accounts>
```

Generate migrations: `npm run db:generate`
Apply migrations: `npm run db:migrate`

## Testing Structure

Tests mirror source structure exactly:

```
src/components/accounts/AccountList.tsx
→ src/__tests__/components/accounts/AccountList.test.tsx

src/lib/services/account-service.ts
→ src/__tests__/lib/services/account-service.test.ts

src/app/api/accounts/route.ts
→ src/__tests__/api/accounts/accounts.test.ts
```

Test file structure:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  })

  it('should render correctly', () => {
    // Test
  })
})
```

## Documentation Structure

- Architecture docs: `docs/architecture/`
- Feature specs: `docs/stories/{epic}.{story}.story.md`
- PRD documents: `docs/prd/`
- Bug fixes: `docs/fixes/{issue}-fix.md`
- Project overview: `docs/PROJECT_BRIEF.md`

## Key Architectural Patterns

### Server-First Architecture
- Default to React Server Components
- Add `'use client'` only when needed (hooks, interactivity, browser APIs)
- Fetch data in server components or API routes, never in client components

### Repository Pattern
- Database access only through service layer (`src/lib/services/`)
- Services encapsulate queries and business logic
- API routes and server actions consume services

### Type Safety Flow
1. Define schema in `src/lib/db/schema.ts`
2. Infer types using `InferSelectModel` and `InferInsertModel`
3. Validate inputs with Zod schemas
4. Use inferred types throughout application

### Component Composition
- Small, focused components
- Compose complex UIs from simple primitives
- Use Shadcn UI components from `src/components/ui/`
- Feature-specific components in domain folders

## Where to Put New Code

When adding new functionality, follow this decision tree:

1. New page? → `src/app/{route}/page.tsx`
2. New API endpoint? → `src/app/api/{resource}/route.ts`
3. New component? → `src/components/{feature}/{Component}.tsx`
4. New database query? → `src/lib/services/{feature}-service.ts`
5. New mutation? → `src/lib/actions/{feature}.ts`
6. New utility? → `src/lib/utils/{category}.ts`
7. New hook? → `src/lib/hooks/use-{name}.ts`
8. New type? → `src/lib/types/{domain}.ts` or infer from schema
9. New test? → Mirror source path in `src/__tests__/`

## Common Mistakes to Avoid

- Don't create utilities in component folders (use `src/lib/utils/`)
- Don't put business logic in components (use services or actions)
- Don't use relative imports across directories (use `@/` alias)
- Don't create multiple schema files (use `src/lib/db/schema.ts`)
- Don't fetch data in client components (use server components or API routes)
- Don't put page-specific components in shared folders (use `_components/` in page directory)
- Don't edit migration files manually (use `npm run db:generate`)
- Don't create custom auth logic (use Clerk utilities from `src/lib/auth/`)
