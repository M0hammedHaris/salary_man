# SalaryMan Redesign Strategy - Complete Screen Guide

## Overview
This document outlines the complete UI/UX redesign strategy for SalaryMan, prioritizing a **"Mobile-First"** and **"Modern Fintech"** aesthetic. All screens are designed for web using Google Stitch.

---

## Design System Guidelines

### Aesthetic Direction
- **Style**: Modern Fintech / "Pastel Pop" with clean gradients
- **Colors**: High-contrast with pastel accents (blues, purples, greens)
- **Typography**: Clean, readable sans-serif fonts
- **Layout**: Card-based, mobile-optimized with generous spacing
- **Interactions**: Smooth animations, tactile feedback

---

## Complete Screen List

| # | Screen Name | Description | Priority |
|---|-------------|-------------|----------|
| 1 | Landing Page | Welcome page with sign-in/sign-up | High |
| 2 | Dashboard | Financial overview with metrics | High |
| 3 | Accounts | Bank accounts & cards management | High |
| 4 | Add Transaction | Quick transaction entry with numpad | High |
| 5 | Transactions List | Full transaction history with filters | High |
| 6 | Analytics | Charts and spending insights | Medium |
| 7 | Savings Goals | Goal tracking with progress | Medium |
| 8 | Bills | Bill payments and reminders | Medium |
| 9 | Profile | User profile settings | Low |
| 10 | Settings | App preferences and configuration | Low |

---

## Stitch-Optimized Prompts for Each Screen
-   **Project ID:** `5085800056080670923`

### 📱 Screen 1: Landing Page
```
Create a modern fintech landing page for a personal finance app called "SalaryMan".

LAYOUT (Mobile-first, single column):
- Top: Logo "SalaryMan" with Beta badge, Sign In + Get Started buttons
- Hero section with large headline "Take Control of Your Financial Future"
- Subtitle about secure finance management
- Two CTA buttons: "Start Free Today" (primary) + "Sign In" (secondary)
- Feature grid with 3 cards: "Bank-Level Security", "Smart Insights", "Goal Tracking"

DESIGN:
- Background: Subtle gradient from light blue to white
- Cards: White with slight shadow, rounded corners (12px)
- Icons: Colored circles with icons inside (Shield, TrendingUp, Target)
- Colors: Primary blue (#3B82F6), Green accents, Purple accents
- Premium, professional feel with ample whitespace
```

---

### 📱 Screen 2: Dashboard
```
Create a financial dashboard for a mobile-first personal finance app.

LAYOUT (Mobile-first):
- Fixed navigation bar at bottom with 5 icons: Home, Analytics, Add (+), Savings, Profile
- Top header with greeting "Good Evening, [User]" and notification bell
- Scrollable content:

MAIN CONTENT (vertical stack):
1. Financial Health Score card - circular progress showing score "100" with "Excellent" label
2. Net Worth card - large amount "₹75,883" with breakdown:
   - Checking: ₹0
   - Savings: ₹75,883
   - Credit: ₹0
3. Account list - horizontal scrollable cards showing bank accounts (BOB, RBL, SBI)
4. Quick Actions row - horizontal pill buttons
5. Recent Transactions list - 3-5 recent items with icon, name, category, amount
6. Analytics preview card - small chart with "View Analytics" button
7. Savings Goals preview - progress bars for active goals

FLOATING BUTTON: "+" Add Transaction button in bottom right

DESIGN:
- Pastel color scheme with soft gradients
- Cards with 16px rounded corners
- Indian Rupee (₹) currency format
- Green for positive trends, Red for negative
- Clean white background with subtle shadows
```

---

### 📱 Screen 3: Accounts
```
Create an account management screen for a personal finance app.

LAYOUT (Mobile-first):
- Header: "Account Management" title with wallet icon
- Subtitle: "Manage your bank accounts, credit cards, and other financial accounts"

MAIN CONTENT:
1. Total Balance summary card at top - "₹75,883" with breakdown
2. Filter tabs: All | Checking | Savings | Credit Card
3. Add Account button (+ icon, outlined)
4. Account cards list - each card shows:
   - Bank logo/icon
   - Account name (e.g., "BOB", "RBL Bank")
   - Account type badge (Savings, Credit Card)
   - Balance amount
   - Status indicator (green checkmark if active)
   - Edit/Delete actions (three-dot menu)

EMPTY STATE: When no accounts, show illustration with "Add Your First Account" prompt

DESIGN:
- Card-based layout with subtle shadows
- Horizontal scrollable cards for account types at top
- Each account card has rounded corners (12px)
- Color-coded by account type (blue for savings, orange for credit)
- Indian Rupee (₹) format
```

---

### 📱 Screen 4: Add Transaction
```
Create a transaction entry screen for a personal finance app.

LAYOUT (Mobile-first, full-screen modal style):
- Close button (X) at top left
- Type toggle: "Expense" | "Income" (pill switches)
- Date selector showing current date

MAIN INPUT AREA:
1. Large amount display at center - "₹0" starting, updates as user types
2. Account selector dropdown - "Select Account"
3. Category pills grid (2x4 grid):
   - Food & Dining 🍔
   - Shopping 🛒
   - Transportation 🚗
   - Entertainment 🎬
   - Bills & Utilities 💡
   - Health 🏥
   - Travel ✈️
   - Other ➕
4. Notes input field (optional)
5. Custom numpad at bottom:
   - 1-9 grid
   - 0, decimal point (.), backspace
   - "Save Transaction" button below numpad

DESIGN:
- Full-height screen, no navigation bar
- Dark header area with amount, light body
- Category pills with emoji icons, pastel colored
- Large, tactile numpad buttons (48px height minimum)
- Primary button for save action
```

---

### 📱 Screen 5: Transactions List
```
Create a transaction history screen for a personal finance app.

LAYOUT (Mobile-first):
- Header: "Transaction Management" title
- Subtitle: "Track your income and expenses"

FILTERS ROW:
- Date range picker (This Week, This Month, Custom)
- Category filter dropdown
- Type filter: All | Income | Expense
- Search input

TRANSACTIONS LIST:
- Grouped by date (e.g., "Today", "Yesterday", "Feb 5, 2024")
- Each transaction item shows:
   - Category icon (colored circle)
   - Description/merchant name
   - Category label (small text)
   - Amount (green for income, red for expense)
   - Time
- Swipe actions: Edit (blue), Delete (red)

SUMMARY BAR (sticky at top):
- Period total: Income vs Expense comparison
- Net: +/- amount

FLOATING BUTTON: "+" Add Transaction

DESIGN:
- Clean list with alternating subtle backgrounds
- Sticky date headers
- Color-coded amounts (green income, red expense)
- Category icons with consistent styling
```

---

### 📱 Screen 6: Analytics
```
Create a financial analytics dashboard for a personal finance app.

LAYOUT (Mobile-first, scrollable):
- Header: "Analytics" title
- Subtitle: "Track your financial patterns"
- Date range selector: Week | Month | Year | Custom

MAIN CONTENT (vertical stack):
1. Summary cards row (horizontal scroll):
   - Total Spending: ₹XX,XXX
   - Total Income: ₹XX,XXX
   - Net: +/- ₹X,XXX
   - Savings Rate: XX%

2. Spending by Category - Donut chart with legend
   - Show top 5 categories with percentages
   - Center: Total amount

3. Income vs Expense - Bar chart
   - Monthly comparison (last 6 months)
   - Stacked or side-by-side bars

4. Spending Trends - Line chart
   - Daily spending over selected period
   - Average line overlay

5. Top Categories list:
   - Ranked list with progress bars
   - Category icon, name, amount, percentage

DESIGN:
- Charts with pastel gradient fills
- Clean axes, minimal grid lines
- Interactive elements (tap for details)
- Consistent color palette across all charts
```

---

### 📱 Screen 7: Savings Goals
```
Create a savings goals screen for a personal finance app.

LAYOUT (Mobile-first):
- Header: "Savings Goals & Financial Planning"
- Subtitle: "Track your progress, achieve milestones"

MAIN CONTENT:
1. Summary stats at top:
   - Total Saved: ₹XX,XXX
   - Active Goals: X
   - Completed: X

2. Goals grid (2 columns on mobile, 3 on desktop):
   Each goal card shows:
   - Goal icon/image
   - Goal name (e.g., "Emergency Fund", "Vacation")
   - Progress bar (circular or horizontal)
   - Current / Target amount
   - Target date
   - Edit/Delete menu

3. Add Goal button (full-width, outlined)

EMPTY STATE: Motivational illustration with "Start Your First Goal" CTA

MODAL for Add/Edit Goal:
- Goal name input
- Target amount input
- Target date picker
- Icon/category selector
- Auto-contribute toggle

DESIGN:
- Goal cards with progress indicators
- Celebratory styling for completed goals (confetti, checkmark)
- Pastel gradient backgrounds on cards
- Progress bars with animated fills
```

---

### 📱 Screen 8: Bills
```
Create a bill management screen for a personal finance app.

LAYOUT (Mobile-first):
- Header: "Bills" title
- Subtitle: "Manage your bill payments and reminders"

MAIN CONTENT:
1. Upcoming Bills section:
   - Calendar strip showing next 7 days with bill indicators
   - Bills due soon list with urgency indicators

2. Bill cards list:
   Each card shows:
   - Bill icon (Electricity, Internet, Rent, etc.)
   - Bill name and provider
   - Amount due
   - Due date with countdown (e.g., "Due in 3 days")
   - Status badge: Paid | Pending | Overdue
   - Recurring indicator if applicable

3. Add Bill button

FILTERS:
- Status filter: All | Pending | Paid | Overdue
- Category filter

DESIGN:
- Color-coded status (green: paid, yellow: pending, red: overdue)
- Due date countdown emphasizes urgency
- Clear visual hierarchy
- Recurring bill indicators
```

---

### 📱 Screen 9: Profile
```
Create a user profile screen for a personal finance app.

LAYOUT (Mobile-first):
- Profile header:
   - Avatar circle (user photo or initial)
   - User display name
   - Email address
   - Edit Profile button

PROFILE SECTIONS (card list):
1. Personal Information card:
   - Name, Email, Phone
   - Edit button

2. Security card:
   - Change Password
   - Two-Factor Authentication toggle
   - Biometric Login toggle

3. Linked Accounts card:
   - Connected bank accounts list
   - Add new account link

4. Preferences card:
   - Currency preference
   - Date format
   - First day of week

5. Sign Out button (at bottom)

DESIGN:
- Clean, organized sections
- Toggle switches for on/off settings
- Chevron indicators for drill-down items
- Avatar with edit overlay
```

---

### 📱 Screen 10: Settings
```
Create a settings screen for a personal finance app.

LAYOUT (Mobile-first):
- Header: "Settings" title

SETTINGS SECTIONS (grouped list):
1. Notifications:
   - Push notifications toggle
   - Email notifications toggle
   - Bill reminders toggle
   - Low balance alerts toggle

2. Appearance:
   - Theme: Light | Dark | System
   - Accent color picker
   - Font size: Small | Medium | Large

3. Privacy & Security:
   - App lock (PIN/Biometric)
   - Data export option
   - Delete account (danger zone)

4. About:
   - App version
   - Terms of Service link
   - Privacy Policy link
   - Help & Support link

DESIGN:
- Grouped sections with headers
- Toggle switches with smooth animations
- Radio selectors for single-choice options
- Danger zone styling for destructive actions (red outline)
- Clear visual separation between sections
```

---

## Implementation Order

### Phase 1: High Priority (Week 1)
1. Dashboard - Core screen users see daily
2. Add Transaction - Critical for daily use
3. Accounts - Essential for setup

### Phase 2: Medium Priority (Week 2)
4. Transactions List - Complete transaction management
5. Analytics - Financial insights
6. Savings Goals - Goal tracking

### Phase 3: Lower Priority (Week 3)
7. Bills - Bill management
8. Landing Page - Marketing screen
9. Profile & Settings - Rarely accessed

---

## Verification Plan

### Visual Verification
- Compare each implemented screen against Stitch design screenshots
- Check color accuracy, spacing, typography

### Mobile Verification
- Test on iPhone 14/15 viewport (390x844)
- Test on common Android sizes
- Verify touch targets are at least 44x44px

### Functional Verification
- All buttons and inputs work as expected
- Data loads correctly
- Forms validate properly
- Navigation flows smoothly
