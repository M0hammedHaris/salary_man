# High Level Architecture

## Technical Summary

SalaryMan employs a modern **Jamstack architecture** with **Next.js 15 App Router** serving as both frontend framework and serverless backend via API routes. The application leverages **server-side rendering** and **static generation** for optimal performance while maintaining **real-time financial data** capabilities. **NeonDB PostgreSQL** provides robust financial data storage with **Drizzle ORM** ensuring type-safe database operations. **Clerk authentication** handles user security and session management, while **Vercel deployment** enables global edge distribution. This architecture achieves PRD goals through scalable serverless functions, automated financial alerts, and responsive user interfaces optimized for comprehensive personal finance management.

## Platform and Infrastructure Choice

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

## Repository Structure

**Structure:** Monorepo with workspace organization
**Monorepo Tool:** Native npm workspaces (leveraging existing package.json structure)
**Package Organization:** 
- Single repository containing all application layers
- Shared type definitions between frontend and backend
- Centralized configuration and tooling
- Environment-specific deployment configurations

**Rationale:** Given the existing Next.js setup and the cohesive nature of the financial management domain, a monorepo approach maximizes code sharing while maintaining clear separation of concerns. This structure enables type safety across the full stack and simplifies deployment workflows.
