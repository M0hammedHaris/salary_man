import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountCreateForm } from '@/components/accounts/account-create-form';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('AccountCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<AccountCreateForm />);
    
    expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Initial Balance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('displays credit limit field when credit card type is selected', async () => {
    render(<AccountCreateForm />);
    
    // Click on account type dropdown
    const typeDropdown = screen.getByRole('combobox');
    fireEvent.click(typeDropdown);
    
    // Select credit card option
    const creditCardOption = screen.getByText(/Credit Card/i);
    fireEvent.click(creditCardOption);
    
    // Credit limit field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Credit Limit/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<AccountCreateForm />);
    
    // Try to submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/Account name is required/i)).toBeInTheDocument();
    });
  });

  it('formats currency input correctly', async () => {
    render(<AccountCreateForm />);
    
    const balanceInput = screen.getByLabelText(/Initial Balance/i);
    
    // Type invalid characters
    fireEvent.change(balanceInput, { target: { value: 'abc123.456' } });
    
    // Should only keep numeric characters and limit decimal places
    await waitFor(() => {
      expect(balanceInput).toHaveValue('123.45');
    });
  });

  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ account: { id: '1', name: 'Test Account' } }),
    });
    global.fetch = mockFetch;

    render(<AccountCreateForm onSuccess={mockOnSuccess} />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Account Name/i), {
      target: { value: 'Test Checking' }
    });
    
    fireEvent.change(screen.getByLabelText(/Initial Balance/i), {
      target: { value: '1000.00' }
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Checking',
          type: 'checking',
          balance: '1000.00',
          description: '',
        }),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Account creation failed' }),
    });
    global.fetch = mockFetch;

    render(<AccountCreateForm />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Account Name/i), {
      target: { value: 'Test Account' }
    });
    
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/Account creation failed/i)).toBeInTheDocument();
    });
  });
});
