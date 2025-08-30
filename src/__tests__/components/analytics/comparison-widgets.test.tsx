import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComparisonWidgets } from '@/components/analytics/comparison-widgets';
import type { AnalyticsComparisons } from '@/lib/types/analytics';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  TrendingUp: ({ className, ...props }: any) => (
    <div data-testid="trending-up-icon" className={className} {...props} />
  ),
  Minus: ({ className, ...props }: any) => (
    <div data-testid="minus-icon" className={className} {...props} />
  ),
  Calendar: ({ className, ...props }: any) => (
    <div data-testid="calendar-icon" className={className} {...props} />
  ),
  DollarSign: ({ className, ...props }: any) => (
    <div data-testid="dollar-sign-icon" className={className} {...props} />
  ),
  CreditCard: ({ className, ...props }: any) => (
    <div data-testid="credit-card-icon" className={className} {...props} />
  ),
  Target: ({ className, ...props }: any) => (
    <div data-testid="target-icon" className={className} {...props} />
  ),
  AlertTriangle: ({ className, ...props }: any) => (
    <div data-testid="alert-triangle-icon" className={className} {...props} />
  ),
  ArrowUpRight: ({ className, ...props }: any) => (
    <div data-testid="arrow-up-right-icon" className={className} {...props} />
  ),
  ArrowDownRight: ({ className, ...props }: any) => (
    <div data-testid="arrow-down-right-icon" className={className} {...props} />
  ),
}));

const mockComparisonData: AnalyticsComparisons = {
  incomeChange: {
    current: 50000,
    previous: 45000,
    change: 5000,
    percentChange: 11.1,
  },
  expenseChange: {
    current: 35000,
    previous: 32000,
    change: 3000,
    percentChange: 9.4,
  },
  savingsChange: {
    current: 15000,
    previous: 13000,
    change: 2000,
    percentChange: 15.4,
  },
  netWorthChange: {
    current: 100000,
    previous: 95000,
    change: 5000,
    percentChange: 5.3,
  },
};

describe('ComparisonWidgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component with default props', () => {
      render(<ComparisonWidgets data={mockComparisonData} />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Income & Expenses')).toBeInTheDocument();
      expect(screen.getByText('Assets & Savings')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <ComparisonWidgets data={mockComparisonData} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Financial Comparison Cards', () => {
    it('displays income comparison correctly', () => {
      render(<ComparisonWidgets data={mockComparisonData} />);
      
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('₹50.0K')).toBeInTheDocument();
      expect(screen.getByText('vs ₹45.0K')).toBeInTheDocument();
      expect(screen.getByText('+11.1%')).toBeInTheDocument();
    });

    it('displays expense comparison correctly', () => {
      render(<ComparisonWidgets data={mockComparisonData} />);
      
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('₹35.0K')).toBeInTheDocument();
      expect(screen.getByText('vs ₹32.0K')).toBeInTheDocument();
      expect(screen.getByText('+9.4%')).toBeInTheDocument();
    });

    it('displays savings comparison correctly', () => {
      render(<ComparisonWidgets data={mockComparisonData} />);
      
      expect(screen.getByText('Net Savings')).toBeInTheDocument();
      expect(screen.getByText('₹15.0K')).toBeInTheDocument();
      expect(screen.getByText('vs ₹13.0K')).toBeInTheDocument();
      expect(screen.getByText('+15.4%')).toBeInTheDocument();
    });

    it('displays net worth comparison correctly', () => {
      render(<ComparisonWidgets data={mockComparisonData} />);
      
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
      expect(screen.getByText('₹1.0L')).toBeInTheDocument();
      expect(screen.getByText('vs ₹95.0K')).toBeInTheDocument();
      expect(screen.getByText('+5.3%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for tabs', () => {
      render(<ComparisonWidgets data={mockComparisonData} />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });
});
