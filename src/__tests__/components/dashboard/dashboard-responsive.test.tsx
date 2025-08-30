import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock Next.js components
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/dashboard'),
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <div data-testid="dashboard-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  Receipt: () => <div data-testid="receipt-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  Coffee: () => <div data-testid="coffee-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}));

// Mock dashboard service
vi.mock('@/lib/services/dashboard', () => ({
  getDashboardData: vi.fn().mockResolvedValue({
    financialHealthScore: {
      score: 75,
      trend: 'up',
      explanation: 'Your financial health is good',
    },
    accountSummary: {
      totalBalance: 5000,
      checkingBalance: 2000,
      savingsBalance: 3000,
      creditCardBalance: -500,
      accounts: [],
    },
    recentTransactions: [
      {
        id: '1',
        description: 'Coffee Shop',
        amount: -4.50,
        categoryName: 'Food & Dining',
        categoryColor: '#10B981',
        transactionDate: new Date(),
        accountName: 'Checking Account',
      },
    ],
    creditCardUtilization: [],
    alerts: [],
  }),
}));

// Mock dashboard components
vi.mock('@/components/layout/breadcrumb-navigation', () => ({
  BreadcrumbNavigation: ({ className }: { className?: string }) => (
    <nav className={className} data-testid="breadcrumb-navigation">
      Breadcrumb
    </nav>
  ),
}));

vi.mock('@/components/dashboard/financial-health-score', () => ({
  FinancialHealthScore: ({ score }: { score: number }) => (
    <div data-testid="financial-health-score">Score: {score}</div>
  ),
}));

vi.mock('@/components/dashboard/account-balance-summary', () => ({
  AccountBalanceSummary: ({ totalBalance }: { totalBalance: number }) => (
    <div data-testid="account-balance-summary">Balance: {totalBalance}</div>
  ),
}));

vi.mock('@/components/dashboard/recent-transactions', () => ({
  RecentTransactions: ({ transactions }: { transactions: any[] }) => (
    <div data-testid="recent-transactions">
      Transactions: {transactions.length}
    </div>
  ),
}));

vi.mock('@/components/dashboard/analytics-quick-access', () => ({
  AnalyticsQuickAccess: () => (
    <div data-testid="analytics-quick-access">Analytics</div>
  ),
}));

vi.mock('@/components/dashboard/savings-quick-access', () => ({
  SavingsQuickAccess: () => (
    <div data-testid="savings-quick-access">Savings</div>
  ),
}));

vi.mock('@/components/dashboard/recurring-payment-insights', () => ({
  RecurringPaymentInsights: ({ userId }: { userId: string }) => (
    <div data-testid="recurring-payment-insights">Insights: {userId}</div>
  ),
}));

vi.mock('@/components/bills/upcoming-bills', () => ({
  UpcomingBills: () => <div data-testid="upcoming-bills">Bills</div>,
}));

vi.mock('@/components/dashboard/credit-card-utilization', () => ({
  CreditCardUtilization: ({ creditCards }: { creditCards: any[] }) => (
    <div data-testid="credit-card-utilization">Cards: {creditCards.length}</div>
  ),
}));

vi.mock('@/components/dashboard/alert-notification-panel', () => ({
  AlertNotificationPanel: ({ alerts }: { alerts: any[] }) => (
    <div data-testid="alert-notification-panel">Alerts: {alerts.length}</div>
  ),
}));

vi.mock('@/components/dashboard/quick-action-floating-button', () => ({
  QuickActionFloatingButton: () => (
    <div data-testid="quick-action-floating-button">Quick Actions</div>
  ),
}));

vi.mock('@/components/dashboard/dashboard-skeleton', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import DashboardPage from '@/app/dashboard/page';

describe('Dashboard Mobile Responsiveness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with mobile-optimized layout', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('financial-health-score')).toBeInTheDocument();
    expect(screen.getByTestId('account-balance-summary')).toBeInTheDocument();
    expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();
  });

  it('has responsive grid layout', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    const mainGrid = document.querySelector('.grid.grid-cols-1.gap-4.sm\\:gap-6.lg\\:grid-cols-3');
    expect(mainGrid).toBeInTheDocument();
  });

  it('has mobile-optimized spacing', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    const breadcrumb = screen.getByTestId('breadcrumb-navigation');
    expect(breadcrumb).toHaveClass('mb-4', 'sm:mb-6');

    const leftColumn = document.querySelector('.lg\\:col-span-2.space-y-4.sm\\:space-y-6');
    expect(leftColumn).toBeInTheDocument();

    const rightColumn = document.querySelector('.space-y-4.sm\\:space-y-6');
    expect(rightColumn).toBeInTheDocument();
  });

  it('has responsive padding for mobile devices', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    const mainContainer = document.querySelector('.mx-auto.max-w-7xl.px-4.py-4.sm\\:px-6.sm\\:py-8.lg\\:px-8');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders all dashboard components in single column on mobile', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    // All major dashboard components should be present
    expect(screen.getByTestId('financial-health-score')).toBeInTheDocument();
    expect(screen.getByTestId('account-balance-summary')).toBeInTheDocument();
    expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-quick-access')).toBeInTheDocument();
    expect(screen.getByTestId('savings-quick-access')).toBeInTheDocument();
    expect(screen.getByTestId('upcoming-bills')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-floating-button')).toBeInTheDocument();
  });

  it('maintains proper component hierarchy for mobile layout', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    // Check that primary components are in the left column
    const leftColumn = document.querySelector('.lg\\:col-span-2');
    expect(leftColumn).toBeInTheDocument();

    // Check that secondary components are in the right column
    const rightColumn = leftColumn?.nextElementSibling;
    expect(rightColumn).toBeInTheDocument();
  });
});
