import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { RecurringPaymentCenter } from '../../../components/recurring-payments/recurring-payment-center';

// Mock the useUser hook
jest.mock('@clerk/nextjs', () => ({
  ...jest.requireActual('@clerk/nextjs'),
  useUser: () => ({ user: { id: 'test-user' } }),
}));

// Mock fetch
global.fetch = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ClerkProvider publishableKey="test-key">
      {children}
    </ClerkProvider>
  </QueryClientProvider>
);

describe('RecurringPaymentCenter', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders the main heading', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectedMonthlyCost: 0, projectedAnnualCost: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(
      <TestWrapper>
        <RecurringPaymentCenter />
      </TestWrapper>
    );

    expect(screen.getByText('Recurring Payments')).toBeInTheDocument();
    expect(screen.getByText('Manage your subscriptions and recurring expenses')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <RecurringPaymentCenter />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner') || document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty state when no payments found', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectedMonthlyCost: 0, projectedAnnualCost: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(
      <TestWrapper>
        <RecurringPaymentCenter />
      </TestWrapper>
    );

    // Wait for the component to finish loading
    await screen.findByText('No recurring payments found');
    expect(screen.getByText('Add Your First Payment')).toBeInTheDocument();
  });

  it('displays summary cards with correct labels', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectedMonthlyCost: 1500, projectedAnnualCost: 18000 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(
      <TestWrapper>
        <RecurringPaymentCenter />
      </TestWrapper>
    );

    await screen.findByText('Total Monthly');
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Missed')).toBeInTheDocument();
  });
});
