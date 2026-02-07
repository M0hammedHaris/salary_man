# Antigravity Rules: SalaryMan

## Project Overview
SalaryMan is a modern, full-stack expense management app designed for personal finance tracking. The goal is to provide a "Modern Clean Fintech" experience with a mobile-first approach.

## Tech Stack
-   **Framework:** Next.js 15 (App Router)
-   **Language:** TypeScript 5.x (Strict)
-   **UI Library:** React 19, Shadcn UI
-   **Styling:** Tailwind CSS v4
-   **Database:** NeonDB (PostgreSQL)
-   **ORM:** Drizzle ORM
-   **Authentication:** Clerk
-   **Validation:** Zod
-   **State Management:** Server Components (primary), React Query (if needed for client)

## Design Principles
1.  **Mobile-First:** All designs must start with mobile viewports (e.g., iPhone 14/15) in mind.
2.  **Visual Excellence:** "Modern Clean Fintech" aesthetic. High contrast, professional typography (Inter/Manrope), subtle shadows, and "Pastel Pop" accents.
3.  **Dashboard-First:** Immediate value on the home screen (Net Worth, Recent Transactions).
4.  **Accessibility:** WCAG 2.1 AA compliance.

## MCP Usage Rules
You MUST use the following MCPs for their respective tasks:

### 1. Stitch MCP (UI Design)
-   **Purpose:** Generating and managing UI designs.
-   **Rule:** ALWAYS use Stitch to generate new screens or significant UI components before coding.
-   **Project:** Use the `SalaryMan Redesign` project (ID: `9992716002442492921`).
-   **Workflow:**
    1.  `mcp_stitch_generate_screen_from_text` to create the visual design.
    2.  Review the output HTML/Image.
    3.  Port the design to Next.js/Tailwind code.

### 2. Neon MCP (Database)
-   **Purpose:** Managing the PostgreSQL database.
-   **Rule:** Use `mcp-server-neon` tools for schema changes, querying, and migrations.
-   **Workflow:**
    1.  Use `describe_project` / `list_branches` to understand the DB state.
    2.  Use `run_sql` for ad-hoc queries or verification.
    3.  For schema changes, prefer Drizzle migrations via code, but use Neon tools to verify.

### 3. Supabase MCP (If needed)
-   *Note: Current project seems to use Neon. Only use Supabase MCP if explicit Supabase services (Storage/Auth) are added.*

## Coding Standards
-   **File Structure:**
    -   `src/app/`: App Router pages.
    -   `src/components/ui/`: Base Shadcn components.
    -   `src/components/dashboard/`: Feature-specific components.
    -   `src/lib/`: Utilities.
    -   `src/db/`: Drizzle schema.
-   **Naming:** PascalCase for components, camelCase for functions.
-   **Clean Code:** No `console.log` in production. robust error handling.

## Documentation
-   Keep `docs/` updated.
-   Update `task.md` with progress.
-   Maintain `docs/redesign_strategy.md` for the current UI overhaul.
