# SalaryMan Redesign Strategy

## Overview
This document outlines the strategy for the UI/UX redesign of SalaryMan, prioritizing a "Mobile-First" and "Modern Clean Fintech" aesthetic.

## Implementation Plan

### 1. Design Source (Stitch MCP)
All designs are generated and managed via Stitch.
-   **Project Name:** SalaryMan Redesign
-   **Project ID:** `9992716002442492921`
-   **Aesthetic:** "Pastel Pop" / Modern Fintech. High contrast, clean, professional.

### 2. Generated Screens
The following screens have been generated and approved for implementation:

| Screen Name | Stitch Screen ID | Description |
| :--- | :--- | :--- |
| **Dashboard** | `0768d2124f7949bca75f44bf02fce325` | Overview of Net Worth, specific recent transactions, quick actions. |
| **Accounts** | `eb2e7218cd694c38a9648237241242e1` | Horizontal card list, bank account list, transfer actions. |
| **Add Transaction** | `119226c506964b49bd92201a19ab4ac5` | Large amount input, category pills, custom numpad. |
| **Analytics** | `61f4e26ca15a46569e39a8e51c19ab56` | Donut chart, spending trends, top categories. |

### 3. Codebase Integration Plan

#### Phase 1: Foundation
-   [ ] Update `globals.css` with valid Tailwind v4 theme variables derived from the designs.
-   [ ] Update `src/app/layout.tsx` for mobile-responsive wrappers.
-   [ ] Install/Update Shadcn UI components to match the new style.

#### Phase 2: Core Screens
-   [ ] **Dashboard:** Implement `src/app/page.tsx` using the Dashboard design.
-   [ ] **Accounts:** Implement `src/app/accounts/page.tsx`.
-   [ ] **Transactions:** Implement the Add Transaction flow (likely a modal or separate page).
-   [ ] **Analytics:** Implement `src/app/analytics/page.tsx`.

### 4. Verification
-   **Visual:** Compare implementation against Stitch screenshots.
-   **Mobile:** Verify on iPhone 14/15 viewport simulation.
-   **Function:** Ensure all buttons and inputs function as expected.
