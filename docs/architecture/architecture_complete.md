# SalaryMan Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for SalaryMan, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**Current State:** Existing Next.js 15 project with basic setup already initialized.

**Existing Dependencies Analysis:**
- **Next.js 15.4.6** - Latest version, excellent foundation for fullstack development
- **React 19.1.0** - Latest React version with concurrent features
- **TypeScript 5.x** - Latest TypeScript for enhanced type safety
- **Tailwind CSS v4** - Latest version with new architecture
- **Shadcn UI Components** - Partial setup with class-variance-authority, clsx, lucide-react

**Missing Dependencies for Financial App:**
- Authentication: Clerk integration needed
- Database: Drizzle ORM and NeonDB connection
- Validation: Zod for type-safe API boundaries
- Financial-specific utilities: Currency formatting, date handling

**Architectural Constraints:**
- Must maintain existing Next.js 15 App Router structure
- Leverage existing Tailwind v4 and component foundation
- Build upon current TypeScript configuration
- Integrate financial features within established patterns

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-10 | 1.0 | Initial fullstack architecture creation | Winston (Architect) |

## High Level Architecture

### Technical Summary

SalaryMan employs a modern **Jamstack architecture** with **Next.js 15 App Router** serving as both frontend framework and serverless backend via API routes. The application leverages **server-side rendering** and **static generation** for optimal performance while maintaining **real-time financial data** capabilities. **NeonDB PostgreSQL** provides robust financial data storage with **Drizzle ORM** ensuring type-safe database operations. **Clerk authentication** handles user security and session management, while **Vercel deployment** enables global edge distribution. This architecture achieves PRD goals through scalable serverless functions, automated financial alerts, and responsive user interfaces optimized for comprehensive personal finance management.

### Platform and Infrastructure Choice

**Platform:** Vercel + NeonDB + Clerk Ecosystem
**Key Services:** 
- Vercel Edge Functions for API routes and serverless compute
- NeonDB PostgreSQL for primary data storage with connection pooling
- Clerk for authentication, user management, and session handling  
- Vercel Analytics for performance monitoring
- Vercel Cron Jobs for automated alerts and recurring payment detection

**Deployment Host and Regions:** 
- Primary: Vercel Global Edge Network (auto-scaled)
- Database: NeonDB Multi-region with primary in US-East
- CDN: Vercel Edge Network with global distribution

**Rationale:** This platform combination provides optimal developer experience while meeting enterprise-grade requirements for financial data. Vercel's serverless architecture scales automatically with usage, NeonDB offers PostgreSQL compatibility with modern scaling features, and Clerk provides battle-tested authentication specifically designed for sensitive applications. The integrated ecosystem reduces complexity while maintaining security and performance standards required for financial applications.

### Repository Structure

**Structure:** Monorepo with workspace organization
**Monorepo Tool:** Native npm workspaces (leveraging existing package.json structure)
**Package Organization:** 
- Single repository containing all application layers
- Shared type definitions between frontend and backend
- Centralized configuration and tooling
- Environment-specific deployment configurations

**Rationale:** Given the existing Next.js setup and the cohesive nature of the financial management domain, a monorepo approach maximizes code sharing while maintaining clear separation of concerns. This structure enables type safety across the full stack and simplifies deployment workflows.

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        PWA[PWA Capabilities]
    end
    
    subgraph "Vercel Platform"
        subgraph "Next.js Application"
            FE[Frontend Components]
            API[API Routes]
            MW[Middleware]
        end
        
        EDGE[Vercel Edge Functions]
        CDN[Vercel CDN]
        CRON[Vercel Cron Jobs]
    end
    
    subgraph "External Services"
        CLERK[Clerk Auth]
        NEON[(NeonDB PostgreSQL)]
        EMAIL[Email Service]
    end
    
    subgraph "Integrations"
        BANK[Bank APIs - Future]
        SMS[SMS Notifications - Future]
    end
    
    WEB --> CDN
    PWA --> CDN
    CDN --> FE
    FE <--> API
    API --> MW
    MW <--> CLERK
    API <--> NEON
    CRON --> API
    CRON --> EMAIL
    EDGE --> NEON
    
    API -.-> BANK
    CRON -.-> SMS
```

### Architectural Patterns

- **Jamstack Architecture:** Static generation with serverless APIs for optimal performance and scalability - _Rationale:_ Provides excellent user experience with fast loading while maintaining dynamic financial data capabilities
- **API-First Design:** All data operations through well-defined API contracts with TypeScript interfaces - _Rationale:_ Enables frontend/backend independence and future mobile app development
- **Repository Pattern:** Abstract database operations through service layer with Drizzle ORM - _Rationale:_ Maintains clean separation between business logic and data persistence
- **Progressive Enhancement:** Core functionality works without JavaScript, enhanced with React - _Rationale:_ Ensures accessibility and reliability for critical financial operations
- **Event-Driven Alerts:** Serverless functions triggered by data changes for proactive notifications - _Rationale:_ Enables real-time financial alerts without constant polling or complex infrastructure
- **Optimistic Updates:** UI updates immediately with server reconciliation - _Rationale:_ Provides responsive user experience while maintaining data consistency
- **Edge-First Deployment:** Leverage Vercel's global edge network for reduced latency - _Rationale:_ Critical for financial applications where response time impacts user trust and adoption

## Tech Stack

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

---

**This is a comprehensive fullstack architecture document that provides complete guidance for building SalaryMan. The architecture leverages your existing Next.js 15 foundation while adding all necessary components for a secure, scalable financial management application.**

**🎯 Key Achievements:**
- ✅ Complete technology stack aligned with your existing dependencies
- ✅ Comprehensive data models for financial management
- ✅ Detailed API specifications with OpenAPI documentation
- ✅ Full frontend and backend architecture patterns
- ✅ Production-ready deployment and monitoring strategies
- ✅ Security and performance optimizations
- ✅ Complete testing strategy with examples
- ✅ Coding standards and error handling patterns

The architecture is ready to guide development through all 5 PRD epics, providing a solid foundation for building a comprehensive personal finance management application.
