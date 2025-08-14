import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountList } from '@/components/accounts/account-list';
import { AccountType } from '@/lib/types/account';

// Mock fetch
global.fetch = vi.fn();

const mockAccounts = [
  {
    id: '1',
    name: 'Test Checking',
    type: AccountType.CHECKING,
    balance: '1000.00',
    isActive: true,
    createdAt: '2025-08-14T06:00:00.000Z',
    updatedAt: '2025-08-14T06:00:00.000Z',
  },
  {
    id: '2',
    name: 'Test Credit Card',
    type: AccountType.CREDIT_CARD,
    balance: '500.00',
    creditLimit: '2000.00',
    isActive: true,
    createdAt: '2025-08-14T06:00:00.000Z',
    updatedAt: '2025-08-14T06:00:00.000Z',
  },
];

describe('AccountList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading skeletons while fetching data', () => {
    const mockFetch = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    global.fetch = mockFetch;

    render(<AccountList />);
    
    // Should show loading skeletons
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
  });

  it('displays empty state when no accounts exist', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accounts: [] }),
    });
    global.fetch = mockFetch;

    render(<AccountList />);
    
    await waitFor(() => {
      expect(screen.getByText(/No Accounts Yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Start by creating your first account/i)).toBeInTheDocument();
    });
  });

  it('displays accounts with correct information', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accounts: mockAccounts }),
    });
    global.fetch = mockFetch;

    render(<AccountList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Checking')).toBeInTheDocument();
      expect(screen.getByText('Test Credit Card')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('-$500.00')).toBeInTheDocument(); // Credit card balance shown as negative
      expect(screen.getByText('$2,000.00')).toBeInTheDocument(); // Credit limit
    });
  });

  it('calculates and displays correct net worth', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accounts: mockAccounts }),
    });
    global.fetch = mockFetch;

    render(<AccountList />);
    
    await waitFor(() => {
      // Net worth = 1000 (checking) - 500 (credit card debt) = 500
      expect(screen.getByText(/Net Worth:.*\$500\.00/)).toBeInTheDocument();
    });
  });

  it('displays credit utilization for credit cards', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accounts: mockAccounts }),
    });
    global.fetch = mockFetch;

    render(<AccountList />);
    
    await waitFor(() => {
      // Credit utilization = 500 / 2000 = 25%
      expect(screen.getByText(/25% utilized/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to fetch accounts' }),
    });
    global.fetch = mockFetch;

    render(<AccountList />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error Loading Accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch accounts/i)).toBeInTheDocument();
    });
  });

  it('calls callback functions when buttons are clicked', async () => {
    const mockOnEditAccount = vi.fn();
    const mockOnCreateAccount = vi.fn();
    
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accounts: mockAccounts }),
    });
    global.fetch = mockFetch;

    render(
      <AccountList 
        onEditAccount={mockOnEditAccount} 
        onCreateAccount={mockOnCreateAccount}
      />
    );
    
    await waitFor(async () => {
      // Click create account button
      const createButton = screen.getByText(/Add Account/i);
      createButton.click();
      expect(mockOnCreateAccount).toHaveBeenCalled();
    });
  });
});
