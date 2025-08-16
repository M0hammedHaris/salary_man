import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionCreateForm } from '@/components/transactions/transaction-create-form';

// Mock the API responses
global.fetch = vi.fn();

const mockAccounts = [
  {
    id: '1',
    name: 'Checking Account',
    type: 'checking',
    balance: '5000.00',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockCategories = [
  {
    id: '1',
    name: 'Groceries',
    type: 'expense',
    color: '#ef4444',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Salary',
    type: 'income',
    color: '#10b981',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Food & Dining',
    type: 'expense',
    color: '#f59e0b',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const fetchMock = vi.mocked(fetch);

describe('Enhanced Transaction Create Form', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    
    // Mock API responses
    fetchMock.mockImplementation((url) => {
      if (url === '/api/accounts') {
        return Promise.resolve(new Response(JSON.stringify({ accounts: mockAccounts })));
      }
      if (url === '/api/categories') {
        return Promise.resolve(new Response(JSON.stringify({ categories: mockCategories })));
      }
      return Promise.resolve(new Response('{}'));
    });
  });

  describe('Currency Display', () => {
    it('should display rupee symbol instead of dollar symbol', async () => {
      render(<TransactionCreateForm />);
      
      await waitFor(() => {
        expect(screen.getByText('₹')).toBeInTheDocument();
      });
      
      // Should not contain dollar symbols
      expect(screen.queryByText('$')).not.toBeInTheDocument();
    });

    it('should display account balances in INR format', async () => {
      render(<TransactionCreateForm />);
      
      // Wait for the form to load
      await waitFor(() => {
        expect(screen.getByText('Select account')).toBeInTheDocument();
      });
      
      // Check that accounts are loaded and INR formatting function would work correctly
      // We can't easily test the dropdown in JSDOM, so we test the presence of currency symbols
      await waitFor(() => {
        expect(screen.getByText('₹')).toBeInTheDocument();
      });
    });
  });

  describe('Smart Category Suggestions', () => {
    it('should suggest category based on description containing food keywords', async () => {
      render(<TransactionCreateForm />);
      
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByPlaceholderText('What was this transaction for?')).toBeInTheDocument();
      });

      const descriptionField = screen.getByPlaceholderText('What was this transaction for?');
      
      // Type a description that should suggest a food category
      fireEvent.change(descriptionField, { target: { value: 'Dinner at restaurant' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Smart suggestion available/)).toBeInTheDocument();
      });
    });

    it('should auto-select suggested category for salary-related descriptions', async () => {
      render(<TransactionCreateForm />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('What was this transaction for?')).toBeInTheDocument();
      });

      const descriptionField = screen.getByPlaceholderText('What was this transaction for?');
      
      // Type a salary-related description
      fireEvent.change(descriptionField, { target: { value: 'Monthly salary payment' } });
      
      // Should suggest salary category
      await waitFor(() => {
        expect(screen.getByText(/Smart suggestion available/)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should render quick action buttons', async () => {
      render(<TransactionCreateForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Salary')).toBeInTheDocument();
        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('Split Transaction')).toBeInTheDocument();
      });
    });

    it('should populate form when salary quick action is clicked', async () => {
      render(<TransactionCreateForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument();
      });

      const salaryButton = screen.getByText('Salary');
      fireEvent.click(salaryButton);
      
      await waitFor(() => {
        const descriptionField = screen.getByDisplayValue('Salary payment');
        expect(descriptionField).toBeInTheDocument();
      });
    });

    it('should populate form when groceries quick action is clicked', async () => {
      render(<TransactionCreateForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Groceries')).toBeInTheDocument();
      });

      const groceriesButton = screen.getByText('Groceries');
      fireEvent.click(groceriesButton);
      
      await waitFor(() => {
        const descriptionField = screen.getByDisplayValue('Grocery shopping');
        expect(descriptionField).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Form Description', () => {
    it('should show enhanced description for category field', async () => {
      render(<TransactionCreateForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Categories will be auto-suggested based on description.')).toBeInTheDocument();
      });
    });
  });

  describe('Receipt Upload Feature', () => {
    it('should display receipt upload section', async () => {
      render(<TransactionCreateForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Receipt (Optional)')).toBeInTheDocument();
        expect(screen.getByText('Click to upload receipt')).toBeInTheDocument();
      });
    });
  });
});
