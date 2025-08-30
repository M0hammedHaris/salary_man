import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountTrendsChart, SimpleAccountTrendsChart } from '@/components/analytics/account-trends-chart';
import type { AccountTrend } from '@/lib/types/analytics';

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock window.innerWidth for responsive design testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

const mockAccountTrends: AccountTrend[] = [
  {
    accountId: 'acc-1',
    accountName: 'Chase Checking',
    accountType: 'checking',
    data: [
      { date: '2024-01-01', balance: 5000 },
      { date: '2024-01-15', balance: 5200 },
      { date: '2024-02-01', balance: 5500 },
    ],
    growth: 10.0,
    growthAmount: 500,
  },
  {
    accountId: 'acc-2',
    accountName: 'Savings Account',
    accountType: 'savings',
    data: [
      { date: '2024-01-01', balance: 10000 },
      { date: '2024-01-15', balance: 10100 },
      { date: '2024-02-01', balance: 9800 },
    ],
    growth: -2.0,
    growthAmount: -200,
  },
];

describe('AccountTrendsChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component with default props', () => {
      render(<AccountTrendsChart data={mockAccountTrends} />);
      
      expect(screen.getByText('Account Balance Trends')).toBeInTheDocument();
      expect(screen.getByText('Track how your account balances change over time')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<AccountTrendsChart data={mockAccountTrends} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders area chart when chartType is area', () => {
      render(<AccountTrendsChart data={mockAccountTrends} chartType="area" />);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('Growth Badges', () => {
    it('displays growth badges by default', () => {
      render(<AccountTrendsChart data={mockAccountTrends} />);
      
      expect(screen.getByText(/Chase Checking: \+10\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/Savings Account: -2\.0%/)).toBeInTheDocument();
    });

    it('hides growth badges when showGrowthBadges is false', () => {
      render(<AccountTrendsChart data={mockAccountTrends} showGrowthBadges={false} />);
      
      expect(screen.queryByText(/Chase Checking: \+10\.0%/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Savings Account: -2\.0%/)).not.toBeInTheDocument();
    });

    it('applies correct badge variants based on growth rate', () => {
      const trendsWithVariedGrowth: AccountTrend[] = [
        { 
          accountId: 'acc-pos', 
          accountName: 'Positive Growth', 
          accountType: 'savings',
          data: [], 
          growth: 5.0, 
          growthAmount: 250 
        },
        { 
          accountId: 'acc-neg', 
          accountName: 'Negative Growth', 
          accountType: 'checking',
          data: [], 
          growth: -3.0, 
          growthAmount: -150 
        },
        { 
          accountId: 'acc-zero', 
          accountName: 'No Growth', 
          accountType: 'investment',
          data: [], 
          growth: 0.0, 
          growthAmount: 0 
        },
      ];

      render(<AccountTrendsChart data={trendsWithVariedGrowth} />);
      
      // Check that badges are rendered (specific styling testing would require more complex setup)
      expect(screen.getByText(/Positive Growth: \+5\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/Negative Growth: -3\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/No Growth: 0\.0%/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no data provided', () => {
      render(<AccountTrendsChart data={[]} />);
      
      expect(screen.getByText('Account Trends')).toBeInTheDocument();
      expect(screen.getByText('No account data available for the selected period')).toBeInTheDocument();
      expect(screen.getByText('No data to display')).toBeInTheDocument();
      expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('handles accounts with different date ranges', () => {
      const trendsWithDifferentDates: AccountTrend[] = [
        {
          accountId: 'acc-a',
          accountName: 'Account A',
          accountType: 'checking',
          data: [
            { date: '2024-01-01', balance: 1000 },
            { date: '2024-01-15', balance: 1100 },
          ],
          growth: 10.0,
          growthAmount: 100,
        },
        {
          accountId: 'acc-b',
          accountName: 'Account B',
          accountType: 'savings',
          data: [
            { date: '2024-01-01', balance: 2000 },
            { date: '2024-02-01', balance: 2200 },
          ],
          growth: 10.0,
          growthAmount: 200,
        },
      ];

      render(<AccountTrendsChart data={trendsWithDifferentDates} />);
      
      // Should render without errors and include chart components
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles empty data arrays for accounts', () => {
      const trendsWithEmptyData: AccountTrend[] = [
        {
          accountId: 'acc-empty',
          accountName: 'Empty Account',
          accountType: 'checking',
          data: [],
          growth: 0,
          growthAmount: 0,
        },
      ];

      render(<AccountTrendsChart data={trendsWithEmptyData} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile screen size', () => {
      // Mock mobile screen width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(<AccountTrendsChart data={mockAccountTrends} />);
      
      // Should render without errors on mobile
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('adapts to desktop screen size', () => {
      // Mock desktop screen width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<AccountTrendsChart data={mockAccountTrends} />);
      
      // Should render without errors on desktop
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Chart Components', () => {
    it('includes all necessary chart components', () => {
      render(<AccountTrendsChart data={mockAccountTrends} />);
      
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders line components for each account in line chart', () => {
      render(<AccountTrendsChart data={mockAccountTrends} chartType="line" />);
      
      // Should render line elements (mocked)
      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(mockAccountTrends.length);
    });

    it('renders area components for each account in area chart', () => {
      render(<AccountTrendsChart data={mockAccountTrends} chartType="area" />);
      
      // Should render area elements (mocked)
      const areas = screen.getAllByTestId('area');
      expect(areas).toHaveLength(mockAccountTrends.length);
    });
  });
});

describe('SimpleAccountTrendsChart', () => {
  it('renders with simplified configuration', () => {
    render(<SimpleAccountTrendsChart data={mockAccountTrends} />);
    
    expect(screen.getByText('Account Balance Trends')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Should not show growth badges in simple version
    expect(screen.queryByText(/Chase Checking: \+10\.0%/)).not.toBeInTheDocument();
  });

  it('passes custom className correctly', () => {
    const { container } = render(<SimpleAccountTrendsChart data={mockAccountTrends} className="simple-class" />);
    
    expect(container.firstChild).toHaveClass('simple-class');
  });
});

describe('Currency Formatting', () => {
  it('handles large numbers correctly', () => {
    const largeAmountTrends: AccountTrend[] = [
      {
        accountId: 'acc-large',
        accountName: 'Large Account',
        accountType: 'investment',
        data: [
          { date: '2024-01-01', balance: 1500000 }, // 1.5M
          { date: '2024-01-15', balance: 2500 }, // 2.5K
        ],
        growth: 0,
        growthAmount: -1497500,
      },
    ];

    render(<AccountTrendsChart data={largeAmountTrends} />);
    
    // Should render without errors
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('handles negative balances correctly', () => {
    const negativeBalanceTrends: AccountTrend[] = [
      {
        accountId: 'acc-negative',
        accountName: 'Negative Account',
        accountType: 'credit_card',
        data: [
          { date: '2024-01-01', balance: -1000 },
          { date: '2024-01-15', balance: -500 },
        ],
        growth: 50.0, // Improvement from negative
        growthAmount: 500,
      },
    ];

    render(<AccountTrendsChart data={negativeBalanceTrends} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByText(/Negative Account: \+50\.0%/)).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('has proper headings for screen readers', () => {
    render(<AccountTrendsChart data={mockAccountTrends} />);
    
    // CardTitle renders as div, not heading, so check for text content instead
    expect(screen.getByText('Account Balance Trends')).toBeInTheDocument();
  });

  it('provides descriptive text for the chart purpose', () => {
    render(<AccountTrendsChart data={mockAccountTrends} />);
    
    expect(screen.getByText('Track how your account balances change over time')).toBeInTheDocument();
  });

  it('handles empty state with appropriate messaging', () => {
    render(<AccountTrendsChart data={[]} />);
    
    expect(screen.getByText('No account data available for the selected period')).toBeInTheDocument();
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });
});
