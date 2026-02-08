---
inclusion: always
---

# Technology Stack & Development Guidelines

## Tech Stack Overview

### Core Framework
- Next.js 15.5.9 with App Router (React Server Components by default)
- TypeScript 5.x with strict mode
- React 19.1.0
- Node.js >=20.0.0

### Database Stack
- NeonDB (Serverless PostgreSQL)
- Drizzle ORM 0.44.5 with Drizzle Kit 0.31.4
- Schema: `src/lib/db/schema.ts`
- Migrations: `drizzle/migrations/`

### Key Libraries
- Auth: Clerk 6.30.0
- Validation: Zod 4.0.17
- State: TanStack Query 5.85.5
- Forms: React Hook Form 7.62.0
- Styling: Tailwind CSS v4
- UI: Shadcn UI (Radix primitives)
- Financial Math: Decimal.js 10.6.0
- Date Utils: date-fns 4.1.0
- Charts: Recharts 3.1.2
- Icons: Lucide React 0.539.0
- Notifications: Sonner 2.0.7
- Testing: Vitest 3.2.4 + Testing Library

## Critical Development Rules

### Component Architecture
- Use React Server Components by default
- Add `'use client'` directive only when needed (interactivity, hooks, browser APIs)
- Server components for data fetching, static content, and layouts
- Client components for forms, interactive UI, and state management
- Never fetch data in client components - use server components or API routes

### TypeScript Conventions
- Strict mode enabled - no implicit any
- Infer types from Drizzle schema using `typeof` and `InferSelectModel`
- Use Zod schemas for runtime validation (API inputs, forms)
- Export types alongside implementations
- Prefer type inference over explicit typing where clear

### Import Path Rules
- Always use `@/` alias for imports from `src/`
- Example: `import { db } from '@/lib/db'`
- Never use relative paths that traverse up directories (`../../`)
- Group imports: external packages, then `@/` imports, then types

### Financial Data Handling (CRITICAL)
- NEVER use JavaScript number arithmetic for money
- ALWAYS use Decimal.js for all financial calculations
- Database storage: `numeric(12, 2)` type
- Round only for display, never during calculations
- Currency format: ₹1,234.56 (INR default)
- Example:
  ```typescript
  import Decimal from 'decimal.js';
  const total = new Decimal(amount1).plus(amount2);
  ```

### Database Patterns
- Single schema file: `src/lib/db/schema.ts`
- Use Drizzle relations for joins
- Generate migrations: `npm run db:generate` (never write SQL manually)
- Apply migrations: `npm run db:migrate`
- Use `db:push` only in development for quick schema changes
- All queries through Drizzle ORM - no raw SQL unless absolutely necessary

### Authentication Rules
- Never implement custom auth - use Clerk exclusively
- All data queries must filter by `userId` from Clerk
- Protect routes via middleware: `src/middleware.ts`
- Use `auth()` helper in server components
- Use `useAuth()` hook in client components
- Never expose other users' data

### Form Handling
- Use React Hook Form with Zod resolvers
- Define Zod schema first, infer TypeScript type
- Server-side validation in API routes (never trust client)
- Display errors using form state
- Example pattern:
  ```typescript
  const schema = z.object({ amount: z.string() });
  type FormData = z.infer<typeof schema>;
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  ```

### API Route Conventions
- File: `app/api/[resource]/route.ts`
- Export named functions: GET, POST, PUT, DELETE
- Return `NextResponse.json()` for all responses
- Validate inputs with Zod schemas
- Handle errors with try-catch and appropriate status codes
- Always check authentication first

### State Management Strategy
- Server state: TanStack Query for caching and synchronization
- Form state: React Hook Form
- UI state: React useState/useReducer
- Global client state: React Context (or Zustand if complex)
- Avoid prop drilling - use context for deeply nested state

### Styling Guidelines
- Tailwind utility classes preferred over custom CSS
- Use `cn()` helper for conditional classes: `cn('base-class', condition && 'conditional-class')`
- Shadcn components for consistent UI primitives
- Responsive design: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Dark mode support via Tailwind's `dark:` variant

### Testing Requirements
- Test files: `src/__tests__/` mirroring source structure
- Naming: `*.test.ts` or `*.test.tsx`
- Run tests: `npm run test:run` (single run) or `npm run test` (watch)
- Unit tests for utilities and services
- Component tests for UI components
- Integration tests for API routes
- Use Testing Library queries: `getByRole`, `getByLabelText` (avoid `getByTestId`)

### Date Handling
- Use date-fns for all date operations
- Store dates in UTC in database
- Display in user timezone
- Format: MM/dd/yyyy (default)
- Example: `format(new Date(), 'MM/dd/yyyy')`

### Error Handling
- Use error boundaries for component errors
- Try-catch in async operations
- Return error responses from API routes with proper status codes
- Display user-friendly error messages (use Sonner for toasts)
- Log errors for debugging but never expose sensitive data

### Performance Patterns
- Use React Server Components for initial page load
- Implement loading states with Suspense boundaries
- Optimize images with Next.js Image component
- Use TanStack Query for automatic caching and deduplication
- Implement optimistic updates for better UX

## Common Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # Run ESLint
```

### Testing
```bash
npm run test:run         # Run tests once (use in CI)
npm run test             # Watch mode
npm run test:coverage    # Coverage report
```

### Database
```bash
npm run db:generate      # Generate migrations from schema
npm run db:migrate       # Apply migrations
npm run db:push          # Push schema (dev only)
npm run db:studio        # Open Drizzle Studio GUI
```

## Environment Setup

Required in `.env.local`:
```
DATABASE_URL=                          # NeonDB connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=    # Clerk public key
CLERK_SECRET_KEY=                      # Clerk secret key
NEXT_PUBLIC_APP_URL=                   # App URL (http://localhost:3000 in dev)
```

## Code Quality Checklist

Before committing code, verify:
- [ ] TypeScript compiles without errors
- [ ] ESLint passes (`npm run lint`)
- [ ] Tests pass (`npm run test:run`)
- [ ] Financial calculations use Decimal.js
- [ ] All imports use `@/` alias
- [ ] Server/client components correctly marked
- [ ] Authentication checks in place
- [ ] Input validation with Zod
- [ ] Error handling implemented
- [ ] Responsive design tested
