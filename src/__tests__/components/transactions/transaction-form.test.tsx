import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionCreateForm } from '@/components/transactions/transaction-create-form';

// Mock repositories
vi.mock('@/lib/db/repositories', () => ({
  repositories: {
    accounts: {
      findByUserId: vi.fn(),
    },
    categories: {
      findByUserId: vi.fn(),
    },
    transactions: {
      createWithBalanceUpdate: vi.fn(),
    },
  },
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user123',
  }),
}));

describe('Transaction Create Form Component Tests (Task 9)', () => {
  const mockAccounts = [
    {
      id: 'account123',
      name: 'Checking Account',
      type: 'checking' as const,
      balance: '1000.00',
      userId: 'user123',
      isActive: true,
      creditLimit: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  const mockCategories = [
    {
      id: 'cat123',
      name: 'Food & Dining',
      userId: 'user123',
      type: 'expense' as const,
      color: '#6366f1',
      isDefault: false,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch calls for accounts and categories
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accounts: mockAccounts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: mockCategories }),
      });
  });

  it('should render transaction create form with all required fields', async () => {
    const mockOnSuccess = vi.fn();
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /transaction date/i })).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create transaction/i })).toBeInTheDocument();
    });

    // Try to submit without filling fields
    await user.click(screen.getByRole('button', { name: /create transaction/i }));

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/account is required/i)).toBeInTheDocument();
    });
  });

  it('should submit transaction successfully', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    // Mock successful transaction creation
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accounts: mockAccounts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: mockCategories }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          transaction: {
            id: 'txn123',
            userId: 'user123',
            accountId: 'account123',
            categoryId: 'cat123',
            amount: '100.00',
            description: 'Test transaction',
            transactionDate: new Date().toISOString(),
            isRecurring: false,
            recurringPaymentId: null,
            receiptUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }),
      });
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/description/i), 'Test transaction');
    await user.type(screen.getByLabelText(/amount/i), '100.00');
    
    // Select account
    await user.click(screen.getByRole('combobox', { name: /account/i }));
    await user.click(screen.getByText('Checking Account'));
    
    // Select category
    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(screen.getByText('Food & Dining'));

    // Submit form
    await user.click(screen.getByRole('button', { name: /create transaction/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test transaction'),
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle transaction creation errors', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    // Mock failed transaction creation
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accounts: mockAccounts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: mockCategories }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Transaction creation failed' }),
      });
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/description/i), 'Test transaction');
    await user.type(screen.getByLabelText(/amount/i), '100.00');
    
    await user.click(screen.getByRole('combobox', { name: /account/i }));
    await user.click(screen.getByText('Checking Account'));
    
    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(screen.getByText('Food & Dining'));

    // Submit form
    await user.click(screen.getByRole('button', { name: /create transaction/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create transaction/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should handle positive and negative amounts correctly', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    
    // Test negative amount (expense)
    await user.type(amountInput, '-50.00');
    expect(amountInput).toHaveValue('-50.00');

    await user.clear(amountInput);
    
    // Test positive amount (income)
    await user.type(amountInput, '100.00');
    expect(amountInput).toHaveValue('100.00');
  });

  it('should load accounts and categories on mount', async () => {
    const mockOnSuccess = vi.fn();
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/accounts');
      expect(global.fetch).toHaveBeenCalledWith('/api/categories');
    });
  });

  it('should show loading state during form submission', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    // Mock delayed response for form submission
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accounts: mockAccounts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: mockCategories }),
      })
      .mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ transaction: {} })
        }), 1000)
      ));
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    // Fill and submit form
    await user.type(screen.getByLabelText(/description/i), 'Test transaction');
    await user.type(screen.getByLabelText(/amount/i), '100.00');
    
    await user.click(screen.getByRole('combobox', { name: /account/i }));
    await user.click(screen.getByText('Checking Account'));
    
    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(screen.getByText('Food & Dining'));

    await user.click(screen.getByRole('button', { name: /create transaction/i }));

    // Check for loading state
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });

  it('should display transaction type indicators', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    render(<TransactionCreateForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    
    // Enter a negative amount to trigger expense indicator
    await user.type(amountInput, '-50.00');
    
    // Should show expense indicator or styling
    await waitFor(() => {
      // This would depend on the actual implementation
      expect(amountInput).toHaveClass(/negative|expense/);
    });
  });
});
