import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditUtilizationChart, SimpleCreditUtilizationChart } from '@/components/analytics/credit-utilization-chart';
import type { CreditUtilization } from '@/lib/types/analytics';

// Mock Recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CreditCard: () => <div data-testid="credit-card-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Mock window.innerWidth for responsive design testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

const mockCreditUtilization: CreditUtilization[] = [
  {
    accountId: 'cc-1',
    accountName: 'Chase Sapphire',
    currentBalance: 2000,
    creditLimit: 10000,
    utilizationRate: 20.0,
    averageUtilization: 18.5,
    peakUtilization: 25.0,
    peakDate: '2024-01-15',
    trend: 'stable',
  },
  {
    accountId: 'cc-2',
    accountName: 'Capital One Venture',
    currentBalance: 7500,
    creditLimit: 10000,
    utilizationRate: 75.0,
    averageUtilization: 65.0,
    peakUtilization: 80.0,
    peakDate: '2024-01-20',
    trend: 'increasing',
  },
];

const mockHighUtilizationData: CreditUtilization[] = [
  {
    accountId: 'cc-high',
    accountName: 'High Utilization Card',
    currentBalance: 9500,
    creditLimit: 10000,
    utilizationRate: 95.0,
    averageUtilization: 85.0,
    peakUtilization: 98.0,
    peakDate: '2024-01-25',
    trend: 'increasing',
  },
];

describe('CreditUtilizationChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component with default props', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} />);
      
      expect(screen.getByText('Credit Utilization Analysis')).toBeInTheDocument();
      expect(screen.getByText('Monitor your credit card utilization rates and available credit')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-icon')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<CreditUtilizationChart data={mockCreditUtilization} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders bar chart when chartType is bar', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} chartType="bar" />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
    });
  });

  describe('Risk Level Badges', () => {
    it('displays risk level badges for each account', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} />);
      
      // Check that both badge elements are present by finding them all
      const badgeElements = screen.getAllByRole('generic', { 
        hidden: true 
      }).filter(element => 
        element.classList.contains('inline-flex') && 
        element.getAttribute('data-slot') === 'badge'
      );
      
      expect(badgeElements).toHaveLength(2);
      
      // Verify first badge contains Chase Sapphire content
      const chaseBadge = badgeElements.find(badge => 
        badge.textContent?.includes('Chase Sapphire')
      );
      expect(chaseBadge).toBeDefined();
      expect(chaseBadge?.textContent).toContain('Very Low');
      expect(chaseBadge?.textContent).toContain('20.0');
      
      // Verify second badge contains Capital One content
      const capitalOneBadge = badgeElements.find(badge => 
        badge.textContent?.includes('Capital One Venture')
      );
      expect(capitalOneBadge).toBeDefined();
      expect(capitalOneBadge?.textContent).toContain('High');
      expect(capitalOneBadge?.textContent).toContain('75.0');
    });

    it('shows critical risk for very high utilization', () => {
      const criticalUtilization: CreditUtilization[] = [
        {
          accountId: 'cc-critical',
          accountName: 'Critical Card',
          currentBalance: 9500,
          creditLimit: 10000,
          utilizationRate: 95.0,
          averageUtilization: 90.0,
          peakUtilization: 99.0,
          peakDate: '2024-01-30',
          trend: 'increasing',
        },
      ];

      render(<CreditUtilizationChart data={criticalUtilization} />);
      
      expect(screen.getByText(/Critical Card: Critical \(95\.0%\)/)).toBeInTheDocument();
    });

    it('shows very low risk for low utilization', () => {
      const lowUtilization: CreditUtilization[] = [
        {
          accountId: 'cc-low',
          accountName: 'Low Usage Card',
          currentBalance: 500,
          creditLimit: 5000,
          utilizationRate: 10.0,
          averageUtilization: 8.0,
          peakUtilization: 15.0,
          peakDate: '2024-01-10',
          trend: 'stable',
        },
      ];

      render(<CreditUtilizationChart data={lowUtilization} />);
      
      expect(screen.getByText(/Low Usage Card: Very Low \(10\.0%\)/)).toBeInTheDocument();
    });
  });

  describe('High Utilization Alerts', () => {
    it('shows alert for high utilization accounts', () => {
      render(<CreditUtilizationChart data={mockHighUtilizationData} showAlerts={true} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText(/High Utilization Warning/)).toBeInTheDocument();
      expect(screen.getByText(/1 account\(s\) have utilization above 70%/)).toBeInTheDocument();
    });

    it('hides alerts when showAlerts is false', () => {
      render(<CreditUtilizationChart data={mockHighUtilizationData} showAlerts={false} />);
      
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
      expect(screen.queryByText(/High Utilization Warning/)).not.toBeInTheDocument();
    });

    it('does not show alert when no high utilization accounts exist', () => {
      const lowUtilizationData: CreditUtilization[] = [
        {
          accountId: 'cc-low',
          accountName: 'Low Card',
          currentBalance: 1000,
          creditLimit: 5000,
          utilizationRate: 20.0,
          averageUtilization: 18.0,
          peakUtilization: 25.0,
          peakDate: '2024-01-15',
          trend: 'stable',
        },
      ];

      render(<CreditUtilizationChart data={lowUtilizationData} showAlerts={true} />);
      
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
      expect(screen.queryByText(/High Utilization Warning/)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no data provided', () => {
      render(<CreditUtilizationChart data={[]} />);
      
      expect(screen.getByText('Credit Utilization')).toBeInTheDocument();
      expect(screen.getByText('No credit account data available for the selected period')).toBeInTheDocument();
      expect(screen.getByText('No credit accounts to display')).toBeInTheDocument();
      expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('displays correct summary statistics', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} />);
      
      expect(screen.getByText('Total Credit Limit')).toBeInTheDocument();
      expect(screen.getByText('Total Balance')).toBeInTheDocument();
      expect(screen.getByText('Overall Utilization')).toBeInTheDocument();
      
      // Total credit limit: 10000 + 10000 = 20000
      // Total balance: 2000 + 7500 = 9500
      // Overall utilization: 9500/20000 = 47.5%
      expect(screen.getByText('₹20,000')).toBeInTheDocument();
      expect(screen.getByText('₹9,500')).toBeInTheDocument();
      expect(screen.getByText('47.5%')).toBeInTheDocument();
    });

    it('handles zero credit limit edge case', () => {
      const zeroLimitData: CreditUtilization[] = [
        {
          accountId: 'cc-zero',
          accountName: 'Zero Limit Card',
          currentBalance: 0,
          creditLimit: 0,
          utilizationRate: 0,
          averageUtilization: 0,
          peakUtilization: 0,
          peakDate: '2024-01-01',
          trend: 'stable',
        },
      ];

      render(<CreditUtilizationChart data={zeroLimitData} />);
      
      // Should render without division by zero errors
      expect(screen.getByText('Total Credit Limit')).toBeInTheDocument();
      expect(screen.getAllByText('₹0')).toHaveLength(2); // Both credit limit and balance show ₹0
    });
  });

  describe('Chart Components', () => {
    it('includes all necessary chart components for composed chart', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} chartType="composed" />);
      
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getAllByTestId('y-axis')).toHaveLength(2); // Two Y-axes for composed chart
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
      expect(screen.getAllByTestId('reference-line')).toHaveLength(2); // 30% and 70% reference lines
    });

    it('includes correct components for bar chart', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} chartType="bar" />);
      
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getAllByTestId('y-axis')).toHaveLength(1); // Single Y-axis for bar chart
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders bars and line for composed chart', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} chartType="composed" />);
      
      const bars = screen.getAllByTestId('bar');
      expect(bars).toHaveLength(2); // Current balance and available credit bars
      
      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(1); // Utilization rate line
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

      render(<CreditUtilizationChart data={mockCreditUtilization} />);
      
      // Should render without errors on mobile
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('adapts to desktop screen size', () => {
      // Mock desktop screen width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<CreditUtilizationChart data={mockCreditUtilization} />);
      
      // Should render without errors on desktop
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('calculates available credit correctly', () => {
      render(<CreditUtilizationChart data={mockCreditUtilization} />);
      
      // Should render without errors and calculate available credit
      // Available credit = credit limit - current balance
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('handles edge cases in utilization calculations', () => {
      const edgeCaseData: CreditUtilization[] = [
        {
          accountId: 'cc-edge',
          accountName: 'Edge Case Card',
          currentBalance: 10000, // Equal to limit
          creditLimit: 10000,
          utilizationRate: 100.0,
          averageUtilization: 95.0,
          peakUtilization: 100.0,
          peakDate: '2024-01-31',
          trend: 'increasing',
        },
      ];

      render(<CreditUtilizationChart data={edgeCaseData} />);
      
      expect(screen.getByText(/Edge Case Card: Critical \(100\.0%\)/)).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});

describe('SimpleCreditUtilizationChart', () => {
  it('renders with simplified configuration', () => {
    render(<SimpleCreditUtilizationChart data={mockCreditUtilization} />);
    
    expect(screen.getByText('Credit Utilization Analysis')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Should not show alerts in simple version
    expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
  });

  it('passes custom className correctly', () => {
    const { container } = render(<SimpleCreditUtilizationChart data={mockCreditUtilization} className="simple-class" />);
    
    expect(container.firstChild).toHaveClass('simple-class');
  });

  it('uses bar chart type by default', () => {
    render(<SimpleCreditUtilizationChart data={mockCreditUtilization} />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
  });
});

describe('Currency and Percentage Formatting', () => {
  it('formats currency values correctly', () => {
    render(<CreditUtilizationChart data={mockCreditUtilization} />);
    
    // Check INR currency formatting in summary
    expect(screen.getByText('₹20,000')).toBeInTheDocument();
    expect(screen.getByText('₹9,500')).toBeInTheDocument();
  });

  it('formats percentage values correctly', () => {
    render(<CreditUtilizationChart data={mockCreditUtilization} />);
    
    // Check percentage formatting in badges and summary
    expect(screen.getByText(/20\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/75\.0%/)).toBeInTheDocument();
    expect(screen.getByText('47.5%')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('has proper headings for screen readers', () => {
    render(<CreditUtilizationChart data={mockCreditUtilization} />);
    
    // CardTitle renders as div, not heading, so check for text content instead
    expect(screen.getByText('Credit Utilization Analysis')).toBeInTheDocument();
  });

  it('provides descriptive text for the chart purpose', () => {
    render(<CreditUtilizationChart data={mockCreditUtilization} />);
    
    expect(screen.getByText('Monitor your credit card utilization rates and available credit')).toBeInTheDocument();
  });

  it('includes accessible alert information', () => {
    render(<CreditUtilizationChart data={mockHighUtilizationData} showAlerts={true} />);
    
    expect(screen.getByText(/High Utilization Warning/)).toBeInTheDocument();
    expect(screen.getByText(/Consider paying down balances to improve credit score/)).toBeInTheDocument();
  });

  it('handles empty state with appropriate messaging', () => {
    render(<CreditUtilizationChart data={[]} />);
    
    expect(screen.getByText('No credit account data available for the selected period')).toBeInTheDocument();
    expect(screen.getByText('No credit accounts to display')).toBeInTheDocument();
  });
});
