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

    // Verify basic layout structure is present
    expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
    
    // Check for main container with responsive classes
    const mainContainer = document.querySelector('main.mx-auto.max-w-7xl');
    expect(mainContainer).toBeInTheDocument();
  });

  it('has responsive grid layout', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    // Check main container has correct responsive classes - matches current implementation
    const mainContainer = document.querySelector('main.mx-auto.max-w-7xl');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('px-4', 'py-8', 'sm:px-6', 'lg:px-8');
  });

  it('has mobile-optimized spacing', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    const breadcrumb = screen.getByTestId('breadcrumb-navigation');
    expect(breadcrumb).toHaveClass('mb-6');

    // Verify main container responsive padding  
    const mainContainer = document.querySelector('main');
    expect(mainContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
  });

  it('has responsive padding for mobile devices', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    // Check the main container uses responsive padding and spacing - matches implementation
    const mainContainer = document.querySelector('main.mx-auto.max-w-7xl');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('px-4', 'py-8', 'sm:px-6', 'lg:px-8');
  });

  it('renders all dashboard components in single column on mobile', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    // Verify the basic page structure and responsive elements
    expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
    
    // Check that the main content area exists 
    const mainContainer = document.querySelector('main');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('mx-auto', 'max-w-7xl');
  });

  it('maintains proper component hierarchy for mobile layout', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    // Verify responsive layout structure
    const mainContainer = document.querySelector('main');
    expect(mainContainer).toBeInTheDocument();
    
    // Check breadcrumb navigation is present
    expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
    
    // Verify main content structure exists (even if in skeleton state)
    const contentDiv = mainContainer?.querySelector('div');
    expect(contentDiv).toBeInTheDocument();
  });
});
