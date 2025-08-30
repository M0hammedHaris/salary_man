import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RecurringPaymentInsights } from '@/components/dashboard/recurring-payment-insights';

// Mock the currency utility
vi.mock('@/lib/utils/currency', () => ({
  displayCurrency: (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RecurringPaymentInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component title', () => {
    // Setup a failing fetch to see error state
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<RecurringPaymentInsights userId="test-user-id" />);
    
    expect(screen.getByText('Recurring Payments')).toBeInTheDocument();
  });

  it('should show error state when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<RecurringPaymentInsights userId="test-user-id" />);

    // Wait for error state to appear
    expect(await screen.findByText('Unable to load recurring payment insights')).toBeInTheDocument();
  });

  it('should call API endpoint on mount', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<RecurringPaymentInsights userId="test-user-id" />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/recurring-insights');
    });
  });
});