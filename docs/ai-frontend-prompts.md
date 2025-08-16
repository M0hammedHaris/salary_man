# SalaryMan AI Frontend Generation Prompts

Generated from comprehensive UI/UX specification for optimal AI-assisted development.

---

## 🎯 **Master Context Prompt** (Use this first for any session)

```
You are building SalaryMan, a comprehensive personal finance management web application. Here's the foundational context for all components:

**Tech Stack:**
- Next.js 15 with App Router and TypeScript 5.x
- React 19 with modern hooks and concurrent features
- Shadcn UI component library (latest version)
- Tailwind CSS v4 for styling
- Lucide React for icons
- Clerk for authentication

**Design System:**
- Color Palette: Primary #2563eb (Blue 600), Success #10b981 (Emerald 500), Warning #f59e0b (Amber 500), Error #ef4444 (Red 500)
- Typography: Inter font family with clear hierarchy
- Spacing: Tailwind's default scale emphasizing 4, 6, 8, 12, 16 unit values
- Mobile-first responsive design with breakpoints at 768px (tablet) and 1024px (desktop)

**User Personas:**
- Financial Management Professionals managing complex portfolios
- Multi-Account Power Users requiring granular control
- Budget-Conscious Planners focused on spending analysis

**Core Design Principles:**
1. Trust Through Transparency - All calculations include clear explanations
2. Progressive Disclosure - Complex features revealed contextually  
3. Intelligent Automation with User Control - Smart defaults, full customization
4. Clarity Over Complexity - Immediate comprehension prioritized
5. Proactive Assistance Without Overwhelm - Timely, appropriate alerts

The application centers on a dashboard-first approach with comprehensive financial tracking, automated alerts, and detailed analytics.
```

---

## 💰 **Currency Display Component Prompt**

```
**High-Level Goal:** Create a reusable Currency Display component for consistent financial data presentation across SalaryMan with proper formatting, accessibility, and visual states.

**Detailed Instructions:**
1. Create a TypeScript React component named `CurrencyDisplay.tsx`
2. Accept props: `amount` (number), `variant` ('standard' | 'compact' | 'large' | 'trend'), `showSign` (boolean), `className` (optional string)
3. Implement proper INR currency formatting with commas for thousands and 2 decimal precision
4. For 'trend' variant, include directional arrow icons (↑↓) using Lucide React
5. Apply semantic color coding: green for positive values, red for negative, neutral gray for zero
6. Include proper ARIA labels for screen reader accessibility
7. Add loading skeleton state when amount is null/undefined
8. Handle edge cases: very large numbers, zero values, invalid inputs

**Code Examples & Constraints:**
```typescript
// Expected usage:
<CurrencyDisplay amount={1234.56} variant="standard" />
// Should render: $1,234.56

<CurrencyDisplay amount={-500} variant="trend" showSign />
// Should render: -$500 ↓ (in red)
```

Use Tailwind CSS classes only. Color classes should be: `text-emerald-500` (positive), `text-red-500` (negative), `text-slate-500` (neutral). Do NOT use custom CSS or styled-components.

**Strict Scope:** 
Create ONLY the `CurrencyDisplay.tsx` component file. Include proper TypeScript interfaces for props. Do NOT create any parent components or modify existing files.
```

---

## 📊 **Dashboard Overview Prompt**

```
**High-Level Goal:** Create SalaryMan's main dashboard page providing immediate financial clarity with account summaries, recent transactions, alerts, and quick actions in a mobile-first responsive layout.

**Detailed Instructions:**
1. Create `app/dashboard/page.tsx` using Next.js 15 App Router conventions
2. Design mobile-first layout that adapts to tablet (768px+) and desktop (1024px+)
3. Mobile: Single column stack with cards, Desktop: 3-column grid layout
4. Include these sections:
   - Financial Health Score card with trend indicator and tooltip explanation
   - Account Balance Summary showing total checking, savings, credit card balances
   - Credit Card Utilization widget with progress bars and color-coded warnings
   - Recent Transactions list (5 most recent) with category icons
   - Alert Notification panel with priority-based visual hierarchy
   - Floating Action Button for quick transaction entry
5. Use Shadcn UI Card, Badge, Progress, and Button components
6. Implement proper loading states with skeleton placeholders
7. Add hover/focus states with explanatory tooltips for financial calculations
8. Ensure WCAG AA accessibility with proper heading hierarchy (h1 for page title, h2 for sections)

**Code Examples & Constraints:**
```typescript
// Mock data structure for development:
const dashboardData = {
  financialHealth: { score: 85, trend: 'up' },
  accounts: {
    checking: 5420.50,
    savings: 12350.00,
    creditCards: -1200.30
  },
  recentTransactions: [
    { id: 1, amount: -45.67, description: 'Grocery Store', category: 'Food', date: '2025-08-10' }
  ],
  alerts: [
    { id: 1, type: 'warning', message: 'Credit card 70% utilized', priority: 'high' }
  ]
}
```

Color coding: Green for positive balances/trends, red for negative/alerts, amber for warnings. Use `cn()` utility for conditional classes.

**Strict Scope:**
Create ONLY the dashboard page file. Use mock data for now - do NOT implement API calls or authentication logic. Do NOT modify layout.tsx or create additional route files.
```

---

## 💳 **Account Card Component Prompt**

```
**High-Level Goal:** Create a comprehensive Account Card component for displaying bank accounts and credit cards with status indicators, balances, and quick actions in SalaryMan's account management interface.

**Detailed Instructions:**
1. Create `components/ui/account-card.tsx` TypeScript component
2. Support both bank account and credit card account types with different layouts
3. For bank accounts: Show account name, type, balance, last activity date
4. For credit cards: Show card name, current balance, credit limit, utilization percentage, due date
5. Include visual status indicators: green checkmark (healthy), amber warning (attention needed), red alert (critical)
6. Add utilization progress bar for credit cards with color coding: green <30%, amber 30-70%, red >70%
7. Implement quick action menu with edit, view details, and delete options
8. Use responsive design: full width on mobile, fixed width cards on desktop
9. Add subtle hover animations and focus states for accessibility
10. Include balance trend sparkline using simple CSS or inline SVG

**Code Examples & Constraints:**
```typescript
interface AccountCardProps {
  account: {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'investment' | 'credit_card';
    balance: number;
    creditLimit?: number; // Only for credit cards
    lastActivity: string;
    dueDate?: string; // Only for credit cards
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}
```

Use Shadcn UI Card, Badge, Progress, and DropdownMenu components. Apply proper ARIA labels for screen readers. Color classes: `bg-emerald-50 text-emerald-700` (positive), `bg-red-50 text-red-700` (alerts).

**Strict Scope:**
Create ONLY the AccountCard component. Include TypeScript interfaces. Do NOT create parent container or implement actual edit/delete functionality - just handle the callback props.
```

---

## 📝 **Transaction Entry Form Prompt**

```
**High-Level Goal:** Build a streamlined Transaction Entry form component for SalaryMan with intelligent categorization, real-time validation, and mobile-optimized input handling.

**Detailed Instructions:**
1. Create `components/forms/transaction-entry-form.tsx` using React Hook Form and Zod validation
2. Include form fields: amount (currency input), description (text), account selection (dropdown), category (searchable select), date (date picker), type (income/expense toggle)
3. Implement smart amount input with automatic currency formatting as user types
4. Add category suggestions based on description input using mock intelligent matching
5. Show account balance for selected account with insufficient funds warning
6. Include transaction preview panel showing balance impact before submission
7. Add receipt photo upload area with drag-and-drop functionality
8. Implement real-time validation with inline error messages
9. Mobile optimization: Use native input types, thumb-friendly touch targets (44px minimum)
10. Success state with option to "Add Another" or "View in Dashboard"
11. Include form reset and auto-save draft functionality

**Code Examples & Constraints:**
```typescript
// Form schema using Zod:
const transactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description required"),
  accountId: z.string().min(1, "Account selection required"),
  categoryId: z.string().min(1, "Category required"),
  date: z.date(),
  type: z.enum(['income', 'expense'])
})

// Mock category suggestions:
const mockCategories = [
  { id: '1', name: 'Food & Dining', color: '#ef4444' },
  { id: '2', name: 'Transportation', color: '#3b82f6' },
  { id: '3', name: 'Utilities', color: '#8b5cf6' }
]
```

Use Shadcn UI Form, Input, Select, DatePicker, and Button components. Apply Tailwind classes for responsive layout. DO NOT implement actual API submission - use console.log for form data.

**Strict Scope:**
Create ONLY the transaction entry form component with validation. Include TypeScript interfaces and Zod schema. Do NOT create modal wrapper or page-level routing.
```

---

## 🚨 **Alert Notification Component Prompt**

```
**High-Level Goal:** Create a comprehensive Alert Notification system for SalaryMan including individual alert cards, notification center, and priority-based visual hierarchy for financial alerts and reminders.

**Detailed Instructions:**
1. Create `components/ui/alert-notification.tsx` with AlertCard and AlertCenter components
2. Support alert types: 'credit_limit', 'bill_reminder', 'low_balance', 'goal_milestone', 'system'
3. Implement priority levels: 'critical' (red), 'high' (amber), 'medium' (blue), 'low' (gray)
4. AlertCard features: title, message, timestamp, action buttons, dismiss/snooze options
5. Include contextual icons for each alert type using Lucide React
6. Add visual state indicators: unread (bold, colored border), read (muted), acknowledged (checkmark)
7. Implement action button variants: primary action (e.g., "Pay Now"), secondary (e.g., "Review")
8. AlertCenter features: filter by priority/type, search functionality, bulk actions
9. Mobile responsive: full-width cards on mobile, condensed view on desktop
10. Add smooth animations for alert appearance and dismissal
11. Include proper ARIA live regions for screen reader announcements

**Code Examples & Constraints:**
```typescript
interface AlertData {
  id: string;
  type: 'credit_limit' | 'bill_reminder' | 'low_balance' | 'goal_milestone' | 'system';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isAcknowledged: boolean;
  actions?: Array<{
    label: string;
    variant: 'primary' | 'secondary';
    onClick: () => void;
  }>;
}

// Mock alerts for development:
const mockAlerts: AlertData[] = [
  {
    id: '1',
    type: 'credit_limit',
    priority: 'critical',
    title: 'Credit Limit Warning',
    message: 'Chase Sapphire is 85% utilized ($2,125 of $2,500)',
    timestamp: new Date(),
    isRead: false,
    isAcknowledged: false,
    actions: [
      { label: 'Make Payment', variant: 'primary', onClick: () => {} },
      { label: 'View Details', variant: 'secondary', onClick: () => {} }
    ]
  }
]
```

Use Shadcn UI Alert, Card, Badge, and Button components. Color mapping: `border-l-red-500` (critical), `border-l-amber-500` (high), `border-l-blue-500` (medium), `border-l-gray-500` (low).

**Strict Scope:**
Create ONLY the alert notification components. Include TypeScript interfaces and mock data. Do NOT implement actual notification API or persistence logic.
```

---

## 📈 **Financial Chart Component Prompt**

```
**High-Level Goal:** Build responsive financial chart components for SalaryMan's analytics dashboard using Recharts library with consistent styling, accessibility, and mobile optimization.

**Detailed Instructions:**
1. Create `components/charts/financial-charts.tsx` with multiple chart components: LineChart, PieChart, BarChart
2. Implement SpendingTrendChart showing income vs expenses over time
3. Create CategoryBreakdownChart as interactive pie/donut chart with category percentages  
4. Build MonthlyComparisonChart as grouped bar chart for month-over-month analysis
5. Include responsive design: simplified mobile versions, full features on desktop
6. Add consistent color palette matching SalaryMan design system
7. Implement interactive tooltips with financial context and explanations
8. Include loading states with skeleton chart placeholders
9. Add empty states with guidance messages for insufficient data
10. Ensure accessibility with proper ARIA labels and keyboard navigation
11. Include export functionality (PNG/SVG) for charts

**Code Examples & Constraints:**
```typescript
// Install: npm install recharts

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Mock data structure:
const spendingData = [
  { month: 'Jan', income: 5000, expenses: 3200 },
  { month: 'Feb', income: 5200, expenses: 3800 },
  { month: 'Mar', income: 4800, expenses: 3100 }
];

const categoryData = [
  { name: 'Food', value: 1200, color: '#ef4444' },
  { name: 'Transportation', value: 800, color: '#3b82f6' },
  { name: 'Utilities', value: 400, color: '#8b5cf6' }
];

// Color palette for charts:
const CHART_COLORS = {
  income: '#10b981', // emerald-500
  expenses: '#ef4444', // red-500
  primary: '#2563eb', // blue-600
  secondary: '#64748b' // slate-500
};
```

Use Recharts components with Tailwind CSS styling. Responsive breakpoints: hide axis labels on mobile (<768px), show full labels on desktop. Include proper TypeScript interfaces.

**Strict Scope:**
Create ONLY the chart components with mock data. Do NOT implement data fetching logic or create parent dashboard containers. Focus on chart rendering and responsiveness only.
```

---

## 🎨 **Usage Instructions & Best Practices**

### **How to Use These Prompts:**

1. **Start with Master Context:** Always begin any AI session by providing the Master Context prompt first
2. **One Component at a Time:** Use individual component prompts separately - don't combine them
3. **Iterate and Refine:** Review AI output and refine with follow-up prompts as needed
4. **Test Thoroughly:** All generated code requires human review and testing

### **Optimization Tips:**

- **Mobile-First:** All prompts prioritize mobile experience then scale up
- **Accessibility Built-In:** Every component includes WCAG AA considerations
- **Type Safety:** All prompts specify TypeScript interfaces and proper typing
- **Design System Consistency:** Components use your established Shadcn UI + Tailwind foundation

### **Follow-Up Prompts:**
After generating components, you can refine with prompts like:
- "Add loading states to the [component name]"
- "Make the [component name] more accessible for screen readers"
- "Optimize [component name] for mobile touch interactions"
- "Add error handling to the [component name]"

---

## ⚠️ **Important Reminder**

**All AI-generated code requires careful human review, testing, and refinement to be considered production-ready.** These prompts provide excellent starting points, but you must:

- Review for security vulnerabilities
- Test across different devices and browsers  
- Validate accessibility compliance
- Ensure proper error handling
- Integrate with your actual APIs and data sources
- Perform thorough QA testing

The prompts are designed to give you 80% of the component structure - the remaining 20% of polish, integration, and production-readiness is your responsibility as the developer.
