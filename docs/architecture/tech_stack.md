# Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.x | Type-safe frontend development | Prevents runtime errors in financial calculations, enables better IDE support and refactoring |
| Frontend Framework | Next.js | 15.4.6 | Full-stack React framework with App Router | Latest features including React Server Components, optimized bundling, and integrated API routes |
| UI Component Library | Shadcn UI | Latest | Accessible, customizable component system | Built on Radix UI primitives ensuring WCAG compliance for financial accessibility requirements |
| State Management | React Server State + Zustand | Latest | Server state caching + client state | Server Components reduce client state needs, Zustand for complex client interactions |
| Backend Language | TypeScript | 5.x | Type-safe API development | Shared types between frontend/backend, compile-time error detection for financial data operations |
| Backend Framework | Next.js API Routes | 15.4.6 | Serverless API endpoints | Integrated with frontend, automatic deployment, optimal for financial app's request patterns |
| API Style | REST + Server Actions | Next.js 15 | RESTful APIs + form actions | REST for external integrations, Server Actions for form submissions and mutations |
| Database | NeonDB PostgreSQL | Latest | Primary data storage | ACID compliance for financial transactions, modern PostgreSQL features, serverless scaling |
| Cache | Vercel KV (Redis) | Latest | Session and query caching | Fast access for user sessions, frequently accessed financial summaries |
| File Storage | Vercel Blob | Latest | Receipt and document storage | Integrated with Vercel platform, optimized for financial document management |
| Authentication | Clerk | Latest | User authentication and management | Purpose-built for modern apps, supports MFA, session management, and user profiles |
| Frontend Testing | Vitest + Testing Library | Latest | Unit and integration testing | Fast test execution, React component testing, TypeScript support |
| Backend Testing | Vitest + Supertest | Latest | API endpoint testing | Consistent testing framework, HTTP API testing, database integration tests |
| E2E Testing | Playwright | Latest | End-to-end user workflows | Cross-browser testing for critical financial workflows, screenshot comparison |
| Build Tool | Next.js Build System | 15.4.6 | Integrated build and optimization | Turbopack bundler, automatic code splitting, SSR/SSG optimization |
| Bundler | Turbopack | Latest | Fast development and production bundling | Rust-based bundler with Hot Module Replacement for rapid development |
| IaC Tool | Vercel CLI + Config | Latest | Infrastructure as code | Declarative deployment configuration, environment management |
| CI/CD | Vercel Git Integration | Latest | Automated deployment pipeline | Automatic deployments, preview environments, rollback capabilities |
| Monitoring | Vercel Analytics + Web Vitals | Latest | Performance and usage monitoring | Real user metrics, Core Web Vitals tracking for financial UX optimization |
| Logging | Vercel Functions Logs + Axiom | Latest | Application logging and debugging | Structured logging for financial operations, error tracking and alerting |
| CSS Framework | Tailwind CSS | 4.x | Utility-first styling system | Consistent design system, optimal bundle size, excellent developer experience |
| Form Validation | Zod | Latest | Runtime schema validation | Type-safe form validation, API request/response validation for financial data integrity |
| Date/Time Handling | date-fns | Latest | Date manipulation and formatting | Comprehensive date utilities for financial calculations, timezone handling |
| Currency Formatting | Intl NumberFormat + Custom Utils | Native + Custom | Money formatting and calculations | Browser-native formatting with custom precision handling for financial amounts |
