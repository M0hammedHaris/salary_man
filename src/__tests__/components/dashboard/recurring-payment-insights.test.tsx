import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '@clerk/nextjs';
import { RecurringPaymentInsights } from '@/components/dashboard/recurring-payment-insights';

// Mock the hooks and dependencies
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

vi.mock('@/lib/hooks/use-currency', () => ({
  useCurrency: () => ({
    format: (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
    symbol: '₹',
  }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUserData = {
  user: {
    id: 'test-user-id',
  },
};

const mockBudgetAnalysis = {
  totalMonthlyRecurring: 2500,
  totalQuarterlyRecurring: 7500,
  totalYearlyRecurring: 30000,
  budgetAllocation: {
    totalBudget: 50000,
    recurringAllocation: 2500,
    utilizationPercentage: 50,
    availableSpending: 2500,
  },
  categoryBreakdown: [
    {
      categoryId: 'cat-1',
      categoryName: 'Entertainment',
      monthlyAmount: 1500,
      percentage: 60,
      paymentCount: 3,
    },
    {
      categoryId: 'cat-2', 
      categoryName: 'Utilities',
      monthlyAmount: 1000,
      percentage: 40,
      paymentCount: 2,
    },
  ],
  optimizationSuggestions: [
    {
      type: 'duplicate',
      title: 'Potential Duplicate Payments',
      description: 'Found similar payments that might be duplicates',
      impact: 799,
      confidence: 0.8,
      paymentIds: ['payment-1', 'payment-2'],
    },
    {
      type: 'category_overspend',
      title: 'Entertainment Overspending',
      description: 'Entertainment category is over budget by 30%',
      impact: 500,
      confidence: 0.95,
      paymentIds: ['payment-3'],
    },
  ],
  trends: {
    monthlyGrowth: 5.2,
    averagePaymentAmount: 625,
    mostExpensiveCategory: 'Entertainment',
  },
  projections: {
    nextMonth: 2625,
    nextQuarter: 7875,
    yearEnd: 31500,
  },
};

describe('RecurringPaymentInsights', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as Mock).mockReturnValue(mockUserData);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBudgetAnalysis),
    });
  });

  it('should render loading state initially', () => {
    render(<RecurringPaymentInsights />);
    
    expect(screen.getByText('Recurring Payments')).toBeInTheDocument();
    expect(screen.getByText('Loading insights...')).toBeInTheDocument();
  });

  it('should display budget analysis data after loading', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('₹2,500')).toBeInTheDocument();
    });

    expect(screen.getByText('Monthly Recurring')).toBeInTheDocument();
    expect(screen.getByText('₹30,000')).toBeInTheDocument();
    expect(screen.getByText('Yearly Total')).toBeInTheDocument();
    expect(screen.getByText('50% of budget')).toBeInTheDocument();
  });

  it('should display category breakdown', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
    });

    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('₹1,500')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.getByText('3 payments')).toBeInTheDocument();
    expect(screen.getByText('2 payments')).toBeInTheDocument();
  });

  it('should show optimization suggestions', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('Optimization Suggestions')).toBeInTheDocument();
    });

    expect(screen.getByText('Potential Duplicate Payments')).toBeInTheDocument();
    expect(screen.getByText('Entertainment Overspending')).toBeInTheDocument();
    expect(screen.getByText('Save ₹799')).toBeInTheDocument();
    expect(screen.getByText('Save ₹500')).toBeInTheDocument();
  });

  it('should display trends information', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('5.2%')).toBeInTheDocument();
    });

    expect(screen.getByText('Monthly Growth')).toBeInTheDocument();
    expect(screen.getByText('₹625')).toBeInTheDocument();
    expect(screen.getByText('Avg Payment')).toBeInTheDocument();
  });

  it('should handle quick action clicks', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    const viewAllButton = screen.getByText('View All');
    expect(viewAllButton.closest('a')).toHaveAttribute('href', '/dashboard/bills');

    const addPaymentButton = screen.getByText('Add Payment');
    expect(addPaymentButton.closest('a')).toHaveAttribute('href', '/dashboard/bills?action=add');
  });

  it('should handle API error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load insights')).toBeInTheDocument();
    });

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should retry on error button click', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Try again');
    await user.click(retryButton);

    // Should show loading again
    expect(screen.getByText('Loading insights...')).toBeInTheDocument();

    // Mock successful response for retry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBudgetAnalysis),
    });

    await waitFor(() => {
      expect(screen.getByText('₹2,500')).toBeInTheDocument();
    });
  });

  it('should handle empty data gracefully', async () => {
    const emptyAnalysis = {
      totalMonthlyRecurring: 0,
      totalQuarterlyRecurring: 0,
      totalYearlyRecurring: 0,
      budgetAllocation: {
        totalBudget: 0,
        recurringAllocation: 0,
        utilizationPercentage: 0,
        availableSpending: 0,
      },
      categoryBreakdown: [],
      optimizationSuggestions: [],
      trends: {
        monthlyGrowth: 0,
        averagePaymentAmount: 0,
        mostExpensiveCategory: '',
      },
      projections: {
        nextMonth: 0,
        nextQuarter: 0,
        yearEnd: 0,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(emptyAnalysis),
    });

    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(screen.getByText('₹0')).toBeInTheDocument();
    });

    expect(screen.getByText('No recurring payments set up')).toBeInTheDocument();
    expect(screen.getByText('No suggestions available')).toBeInTheDocument();
  });

  it('should show correct progress bar for budget utilization', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      // Find progress bar (implementation-specific)
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('should format currency correctly', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      // Check that amounts are formatted with INR symbol and proper locale
      expect(screen.getByText('₹2,500')).toBeInTheDocument();
      expect(screen.getByText('₹30,000')).toBeInTheDocument();
      expect(screen.getByText('₹1,500')).toBeInTheDocument();
      expect(screen.getByText('₹1,000')).toBeInTheDocument();
    });
  });

  it('should handle user not authenticated', () => {
    (useUser as Mock).mockReturnValue({ user: null });

    render(<RecurringPaymentInsights />);

    expect(screen.getByText('Loading insights...')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should call API with correct parameters', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/recurring-payments/budget-analysis');
    });
  });

  it('should display confidence levels for suggestions', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      // Check that confidence levels are shown (80% and 95% from mock data)
      expect(screen.getByText(/80%/)).toBeInTheDocument();
      expect(screen.getByText(/95%/)).toBeInTheDocument();
    });
  });

  it('should show appropriate icons for different suggestion types', async () => {
    render(<RecurringPaymentInsights />);

    await waitFor(() => {
      // Check for duplicate suggestion icon/indicator
      const duplicateSection = screen.getByText('Potential Duplicate Payments').closest('[data-testid]');
      expect(duplicateSection).toBeInTheDocument();
      
      // Check for overspend suggestion icon/indicator  
      const overspendSection = screen.getByText('Entertainment Overspending').closest('[data-testid]');
      expect(overspendSection).toBeInTheDocument();
    });
  });
});
