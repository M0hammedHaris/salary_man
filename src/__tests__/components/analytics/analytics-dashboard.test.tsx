import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

// Mock the date range selector hook
vi.mock('@/components/analytics/date-range-selector', () => ({
  DateRangeSelector: ({ value, onChange }: any) => (
    <div data-testid="date-range-selector">
      <span>Start: {value.startDate.toISOString()}</span>
      <span>End: {value.endDate.toISOString()}</span>
    </div>
  ),
  useDateRange: () => ({
    dateRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    },
    setDateRange: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock analytics data
const mockAnalyticsData = {
  overview: {
    totalIncome: 5000.00,
    totalExpenses: 3500.00,
    netCashFlow: 1500.00,
    transactionCount: 45,
    accountCount: 3,
    averageTransactionValue: 111.11,
    netWorth: 25000.00,
    totalAssets: 30000.00,
    totalLiabilities: 5000.00,
  },
  cashFlow: [
    { date: '2024-01-01', income: 5000, expenses: 3500, netFlow: 1500 },
  ],
  spendingBreakdown: [
    { categoryId: 'cat1', categoryName: 'Food', amount: 1500, percentage: 42.86, color: '#8884d8' },
  ],
  accountTrends: [
    { accountId: 'acc1', accountName: 'Checking', balanceHistory: [{ date: '2024-01-01', balance: 5000 }] },
  ],
  creditUtilization: [
    { accountId: 'acc2', accountName: 'Credit Card', utilization: 0.30, creditLimit: 10000, currentBalance: 3000 },
  ],
  netWorthHistory: [
    { date: '2024-01-01', assets: 30000, liabilities: 5000, netWorth: 25000 },
  ],
  comparisons: [
    { metric: 'netCashFlow', change: 200, changePercentage: 15.38, trend: 'up' as const },
    { metric: 'income', change: 500, changePercentage: 11.11, trend: 'up' as const },
    { metric: 'expenses', change: 300, changePercentage: 9.38, trend: 'up' as const },
    { metric: 'netWorth', change: 1000, changePercentage: 4.17, trend: 'up' as const },
  ],
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockImplementation((url: string) => {
      const responses: { [key: string]: any } = {
        '/api/analytics/overview': { overview: mockAnalyticsData.overview },
        '/api/analytics/cash-flow': { cashFlow: mockAnalyticsData.cashFlow },
        '/api/analytics/spending-breakdown': { spendingBreakdown: mockAnalyticsData.spendingBreakdown },
        '/api/analytics/account-trends': { accountTrends: mockAnalyticsData.accountTrends },
        '/api/analytics/credit-utilization': { creditUtilization: mockAnalyticsData.creditUtilization },
        '/api/analytics/net-worth': { netWorthHistory: mockAnalyticsData.netWorthHistory },
        '/api/analytics/comparisons': { comparisons: mockAnalyticsData.comparisons },
      };

      const matchedUrl = Object.keys(responses).find(key => url.includes(key));
      if (matchedUrl) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses[matchedUrl]),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });
  });

  it('renders the main heading and description', async () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('Financial Analytics')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive insights into your financial patterns and trends')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AnalyticsDashboard />);

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays overview cards with correct data', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
      expect(screen.getByText('₹1,500.00')).toBeInTheDocument();
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('₹5,000.00')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('₹3,500.00')).toBeInTheDocument();
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
      expect(screen.getByText('₹25,000.00')).toBeInTheDocument();
    });
  });

  it('shows percentage changes from previous period', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('15.4% from previous period')).toBeInTheDocument();
      expect(screen.getByText('11.1% from previous period')).toBeInTheDocument();
      expect(screen.getByText('9.4% from previous period')).toBeInTheDocument();
      expect(screen.getByText('4.2% from previous period')).toBeInTheDocument();
    });
  });

  it('renders tabs for different analytics views', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Cash Flow')).toBeInTheDocument();
      expect(screen.getByText('Spending')).toBeInTheDocument();
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Credit Cards')).toBeInTheDocument();
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
    });
  });

  it('displays transaction summary in overview tab', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Transaction Summary')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument(); // Transaction count
      expect(screen.getByText('3')).toBeInTheDocument(); // Account count
      expect(screen.getByText('₹111.11')).toBeInTheDocument(); // Average transaction
    });
  });

  it('displays assets vs liabilities breakdown', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Assets vs. Liabilities')).toBeInTheDocument();
      expect(screen.getByText('₹30,000.00')).toBeInTheDocument(); // Total assets
      expect(screen.getByText('₹5,000.00')).toBeInTheDocument(); // Total liabilities
    });
  });

  it('includes date range selector', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch overview data')).toBeInTheDocument();
    });
  });

  it('shows placeholder content for chart tabs', async () => {
    render(<AnalyticsDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
    });

    // Check placeholder content for charts
    expect(screen.getByText('Cash flow chart will be implemented in the next task')).toBeInTheDocument();
    expect(screen.getByText('Spending breakdown chart will be implemented in the next task')).toBeInTheDocument();
    expect(screen.getByText('Account trends chart will be implemented in the next task')).toBeInTheDocument();
    expect(screen.getByText('Credit utilization chart will be implemented in the next task')).toBeInTheDocument();
    expect(screen.getByText('Net worth chart will be implemented in the next task')).toBeInTheDocument();
  });

  it('displays correct trend icons based on data', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      // Should have trend icons for each metric
      const trendIcons = document.querySelectorAll('svg');
      expect(trendIcons.length).toBeGreaterThan(0);
    });
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-dashboard-class';
    render(<AnalyticsDashboard className={customClass} />);

    const dashboard = document.querySelector(`.${customClass}`);
    expect(dashboard).toBeInTheDocument();
  });
});
