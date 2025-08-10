# Introduction

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
