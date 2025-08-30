import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NetWorthTracker, { SimpleNetWorthTracker } from '@/components/analytics/net-worth-tracker';
import type { NetWorthData } from '@/lib/types/analytics';

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(props.data)}>
      {children}
    </div>
  ),
  AreaChart: ({ children, ...props }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(props.data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, ...props }: any) => (
    <div data-testid={`line-${dataKey}`} data-stroke={props.stroke}>
      Line
    </div>
  ),
  Area: ({ dataKey, ...props }: any) => (
    <div data-testid={`area-${dataKey}`} data-fill={props.fill}>
      Area
    </div>
  ),
  XAxis: (_props: any) => <div data-testid="x-axis">X Axis</div>,
  YAxis: (_props: any) => <div data-testid="y-axis">Y Axis</div>,
  CartesianGrid: (_props: any) => <div data-testid="cartesian-grid">Grid</div>,
  Tooltip: (_props: any) => <div data-testid="tooltip">Tooltip</div>,
  Legend: (_props: any) => <div data-testid="legend">Legend</div>,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: ({ y, label, ..._props }: any) => (
    <div data-testid="reference-line" data-y={y} data-label={label?.value}>
      Reference Line
    </div>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  TrendingUp: ({ className, ...props }: any) => (
    <div data-testid="trending-up-icon" className={className} {...props} />
  ),
  TrendingDown: ({ className, ...props }: any) => (
    <div data-testid="trending-down-icon" className={className} {...props} />
  ),
  Minus: ({ className, ...props }: any) => (
    <div data-testid="minus-icon" className={className} {...props} />
  ),
  Target: ({ className, ...props }: any) => (
    <div data-testid="target-icon" className={className} {...props} />
  ),
  Calendar: ({ className, ...props }: any) => (
    <div data-testid="calendar-icon" className={className} {...props} />
  ),
}));

const mockNetWorthData: NetWorthData[] = [
  {
    date: '2024-01-01',
    netWorth: 50000,
    assets: 75000,
    liabilities: 25000,
  },
  {
    date: '2024-01-15',
    netWorth: 52000,
    assets: 78000,
    liabilities: 26000,
  },
  {
    date: '2024-02-01',
    netWorth: 55000,
    assets: 82000,
    liabilities: 27000,
  },
];

const emptyNetWorthData: NetWorthData[] = [];

describe('NetWorthTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component with default props', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      expect(screen.getByText('Net Worth Tracker')).toBeInTheDocument();
      expect(screen.getByText('Track your overall financial growth over time')).toBeInTheDocument();
      // Multiple trending up icons exist, we just need to check if at least one exists
      expect(screen.getAllByTestId('trending-up-icon').length).toBeGreaterThan(0);
    });

    it('renders with custom className', () => {
      const { container } = render(
        <NetWorthTracker data={mockNetWorthData} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders area chart by default', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('renders line chart when chartType is line', () => {
      render(<NetWorthTracker data={mockNetWorthData} chartType="line" />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });
  });

  describe('Net Worth Calculations', () => {
    it('displays current net worth correctly', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      // Current net worth should be the last entry: ₹55K
      expect(screen.getByText('₹55.0K')).toBeInTheDocument();
    });

    it('calculates and displays growth correctly', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      // Growth from 52000 to 55000 = +3000 (+5.8%)
      expect(screen.getByText(/\+₹3.0K/)).toBeInTheDocument();
      expect(screen.getByText(/\+5\.8%/)).toBeInTheDocument();
    });

    it('displays decline correctly for negative growth', () => {
      const decliningData: NetWorthData[] = [
        {
          date: '2024-01-01',
          netWorth: 55000,
          assets: 80000,
          liabilities: 25000,
        },
        {
          date: '2024-02-01',
          netWorth: 50000,
          assets: 75000,
          liabilities: 25000,
        },
      ];

      render(<NetWorthTracker data={decliningData} />);
      
      // Decline from 55000 to 50000 = -5000 (-9.1%)
      expect(screen.getByText(/₹-5\.0K/)).toBeInTheDocument();
      expect(screen.getByText(/-9\.1%/)).toBeInTheDocument();
      expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
    });

    it('handles stable net worth correctly', () => {
      const stableData: NetWorthData[] = [
        {
          date: '2024-01-01',
          netWorth: 50000,
          assets: 75000,
          liabilities: 25000,
        },
        {
          date: '2024-02-01',
          netWorth: 50025, // Very small change
          assets: 75025,
          liabilities: 25000,
        },
      ];

      render(<NetWorthTracker data={stableData} />);
      
      expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
    });
  });

  describe('Asset and Liability Display', () => {
    it('displays total assets correctly', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      // Last entry has assets: 82000
      expect(screen.getByText('Assets: ₹82.0K')).toBeInTheDocument();
    });

    it('displays total liabilities correctly', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      // Last entry has liabilities: 27000
      expect(screen.getByText('Liabilities: ₹27.0K')).toBeInTheDocument();
    });

    it('displays goal amount when showGoals is true', () => {
      render(<NetWorthTracker data={mockNetWorthData} showGoals={true} />);
      
      // Goal should be max(55000 * 1.2, 1000000) = 1000000 (₹10.0L)
      expect(screen.getByText(/Goal: ₹10\.0L/)).toBeInTheDocument();
      expect(screen.getByTestId('target-icon')).toBeInTheDocument();
    });

    it('hides goal amount when showGoals is false', () => {
      render(<NetWorthTracker data={mockNetWorthData} showGoals={false} />);
      
      expect(screen.queryByText(/Goal:/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('reference-line')).not.toBeInTheDocument();
    });
  });

  describe('Chart Components', () => {
    it('includes all necessary chart components', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders areas and line for area chart type', () => {
      render(<NetWorthTracker data={mockNetWorthData} chartType="area" />);
      
      expect(screen.getByTestId('area-assets')).toBeInTheDocument();
      expect(screen.getByTestId('area-liabilities')).toBeInTheDocument();
      expect(screen.getByTestId('line-netWorth')).toBeInTheDocument();
    });

    it('renders only lines for line chart type', () => {
      render(<NetWorthTracker data={mockNetWorthData} chartType="line" />);
      
      expect(screen.getByTestId('line-assets')).toBeInTheDocument();
      expect(screen.getByTestId('line-liabilities')).toBeInTheDocument();
      expect(screen.getByTestId('line-netWorth')).toBeInTheDocument();
      expect(screen.queryByTestId('area-assets')).not.toBeInTheDocument();
    });

    it('includes reference line when showGoals is true', () => {
      render(<NetWorthTracker data={mockNetWorthData} showGoals={true} />);
      
      expect(screen.getByTestId('reference-line')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no data provided', () => {
      render(<NetWorthTracker data={emptyNetWorthData} />);
      
      expect(screen.getByText('Net Worth Tracker')).toBeInTheDocument();
      expect(screen.getByText('No net worth data available for the selected period')).toBeInTheDocument();
      expect(screen.getByText('No data to display')).toBeInTheDocument();
    });

    it('does not render chart components in empty state', () => {
      render(<NetWorthTracker data={emptyNetWorthData} />);
      
      expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });
  });

  describe('Timeframe Formatting', () => {
    it('handles month timeframe correctly', () => {
      render(<NetWorthTracker data={mockNetWorthData} timeframe="month" />);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('handles quarter timeframe correctly', () => {
      render(<NetWorthTracker data={mockNetWorthData} timeframe="quarter" />);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('handles year timeframe correctly', () => {
      render(<NetWorthTracker data={mockNetWorthData} timeframe="year" />);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats large amounts correctly', () => {
      const largeAmountData: NetWorthData[] = [
        {
          date: '2024-01-01',
          netWorth: 15000000, // 1.5 Crore
          assets: 20000000,
          liabilities: 5000000,
        },
      ];

      render(<NetWorthTracker data={largeAmountData} />);
      
      expect(screen.getByText('₹1.5Cr')).toBeInTheDocument();
    });

    it('formats medium amounts correctly', () => {
      const mediumAmountData: NetWorthData[] = [
        {
          date: '2024-01-01',
          netWorth: 500000, // 5 Lakh
          assets: 600000,
          liabilities: 100000,
        },
      ];

      render(<NetWorthTracker data={mediumAmountData} />);
      
      expect(screen.getByText('₹5.0L')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('renders action buttons', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      expect(screen.getByText('Set Goal')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('displays last updated date', () => {
      render(<NetWorthTracker data={mockNetWorthData} />);
      
      // Should show the last date from the data
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      expect(screen.getByText(/1\/2\/2024/)).toBeInTheDocument(); // Date format for 2024-02-01
    });
  });

  describe('Single Data Point', () => {
    it('handles single data point correctly', () => {
      const singlePointData: NetWorthData[] = [mockNetWorthData[0]];
      
      render(<NetWorthTracker data={singlePointData} />);
      
      // With single point, growth should be 0
      expect(screen.getByText('₹50.0K')).toBeInTheDocument();
      expect(screen.getByTestId('minus-icon')).toBeInTheDocument(); // Stable trend
    });
  });
});

describe('SimpleNetWorthTracker', () => {
  it('renders with simplified configuration', () => {
    render(<SimpleNetWorthTracker data={mockNetWorthData} />);
    
    expect(screen.getByText('Net Worth Tracker')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument(); // Should use line chart
    expect(screen.queryByText(/Goal:/)).not.toBeInTheDocument(); // Should not show goals
  });

  it('passes custom className correctly', () => {
    const { container } = render(
      <SimpleNetWorthTracker data={mockNetWorthData} className="simple-class" />
    );
    
    expect(container.firstChild).toHaveClass('simple-class');
  });
});

describe('Net Worth Growth Calculations', () => {
  it('calculates positive growth correctly', () => {
    const growthData: NetWorthData[] = [
      {
        date: '2024-01-01',
        netWorth: 100000,
        assets: 120000,
        liabilities: 20000,
      },
      {
        date: '2024-02-01',
        netWorth: 110000, // 10% growth
        assets: 130000,
        liabilities: 20000,
      },
    ];

    render(<NetWorthTracker data={growthData} />);
    
    expect(screen.getByText(/\+₹10.0K/)).toBeInTheDocument();
    expect(screen.getByText(/\+10\.0%/)).toBeInTheDocument();
  });

  it('calculates negative growth correctly', () => {
    const declineData: NetWorthData[] = [
      {
        date: '2024-01-01',
        netWorth: 100000,
        assets: 120000,
        liabilities: 20000,
      },
      {
        date: '2024-02-01',
        netWorth: 80000, // 20% decline
        assets: 100000,
        liabilities: 20000,
      },
    ];

    render(<NetWorthTracker data={declineData} />);
    
    expect(screen.getByText(/₹-20\.0K/)).toBeInTheDocument();
    expect(screen.getByText(/-20\.0%/)).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('has proper headings for screen readers', () => {
    render(<NetWorthTracker data={mockNetWorthData} />);
    
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Net Worth Tracker');
  });

  it('provides descriptive text for the chart purpose', () => {
    render(<NetWorthTracker data={mockNetWorthData} />);
    
    expect(screen.getByText('Track your overall financial growth over time')).toBeInTheDocument();
  });

  it('includes accessible button elements', () => {
    render(<NetWorthTracker data={mockNetWorthData} />);
    
    expect(screen.getByRole('button', { name: /Set Goal/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Data/ })).toBeInTheDocument();
  });

  it('handles empty state with appropriate messaging', () => {
    render(<NetWorthTracker data={emptyNetWorthData} />);
    
    expect(screen.getByText('No net worth data available for the selected period')).toBeInTheDocument();
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });
});
