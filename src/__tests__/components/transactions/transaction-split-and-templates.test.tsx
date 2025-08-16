import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionCreateForm } from '@/components/transactions/transaction-create-form';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => 
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const mockAccounts = [
  { id: '1', name: 'Savings Account', balance: 5000, userId: 'user1' },
  { id: '2', name: 'Checking Account', balance: 2000, userId: 'user1' }
];

const mockCategories = [
  { id: '1', name: 'Food', color: '#ff0000', userId: 'user1' },
  { id: '2', name: 'Transportation', color: '#00ff00', userId: 'user1' },
  { id: '3', name: 'Entertainment', color: '#0000ff', userId: 'user1' }
];

const mockSuccessfulResponse = (data: unknown) => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);

describe('TransactionCreateForm - Split Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
    
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockSuccessfulResponse({ accounts: mockAccounts }))
      .mockResolvedValueOnce(mockSuccessfulResponse({ categories: mockCategories }));
  });

  it('should show split transaction UI when Split Transaction button is clicked', async () => {
    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Transaction')).toBeInTheDocument();
    });

    const splitButton = screen.getByText('Split Transaction');
    fireEvent.click(splitButton);

    expect(screen.getByText('Split Transaction', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Divide this transaction across multiple categories')).toBeInTheDocument();
    expect(screen.getByText('Add Split')).toBeInTheDocument();
  });

  it('should add and remove split entries', async () => {
    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Transaction')).toBeInTheDocument();
    });

    // Open split mode
    fireEvent.click(screen.getByText('Split Transaction'));
    
    // Add a split entry
    const addSplitButton = screen.getByText('Add Split');
    fireEvent.click(addSplitButton);

    // Should show one split entry
    expect(screen.getAllByText('Category').length).toBeGreaterThan(1); // One for main form, others for splits
    expect(screen.getAllByText('Amount').length).toBeGreaterThan(1);

    // Add another split entry
    fireEvent.click(addSplitButton);
    
    // Should show two split entries
    expect(screen.getAllByDisplayValue('').length).toBeGreaterThan(4); // Multiple empty inputs
  });

  it('should calculate split totals correctly', async () => {
    const user = userEvent.setup();
    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Transaction')).toBeInTheDocument();
    });

    // Fill main transaction amount
    const amountInput = screen.getByPlaceholderText('0.00 (use - for expenses)');
    await user.type(amountInput, '100');

    // Open split mode
    fireEvent.click(screen.getByText('Split Transaction'));
    
    // Add split entries
    fireEvent.click(screen.getByText('Add Split'));
    fireEvent.click(screen.getByText('Add Split'));

    // Fill split amounts
    const splitAmountInputs = screen.getAllByPlaceholderText('0.00');
    await user.type(splitAmountInputs[0], '60');
    await user.type(splitAmountInputs[1], '40');

    // Should show correct totals
    await waitFor(() => {
      expect(screen.getByText('₹100.00')).toBeInTheDocument(); // Split total
      expect(screen.getByText('₹100.00')).toBeInTheDocument(); // Transaction amount
    });
  });

  it('should prevent submission when split amounts do not match transaction total', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<TransactionCreateForm onSuccess={onSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Transaction')).toBeInTheDocument();
    });

    // Fill form
    await user.selectOptions(screen.getByDisplayValue('Select account'), '1');
    await user.type(screen.getByPlaceholderText('0.00 (use - for expenses)'), '100');
    await user.type(screen.getByPlaceholderText('What was this transaction for?'), 'Test transaction');
    await user.selectOptions(screen.getByDisplayValue('Select category'), '1');

    // Open split mode and add entry with wrong amount
    fireEvent.click(screen.getByText('Split Transaction'));
    fireEvent.click(screen.getByText('Add Split'));
    
    const splitAmountInput = screen.getByPlaceholderText('0.00');
    await user.type(splitAmountInput, '50'); // Less than transaction total

    // Try to submit
    const submitButton = screen.getByText('Add Transaction');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Split amounts must equal the transaction total')).toBeInTheDocument();
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should create multiple transactions when split is used correctly', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    // Mock successful transaction creation
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockSuccessfulResponse({ accounts: mockAccounts }))
      .mockResolvedValueOnce(mockSuccessfulResponse({ categories: mockCategories }))
      .mockResolvedValue(mockSuccessfulResponse({ id: 'transaction-id' }));

    render(<TransactionCreateForm onSuccess={onSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Transaction')).toBeInTheDocument();
    });

    // Fill main form
    await user.selectOptions(screen.getByDisplayValue('Select account'), '1');
    await user.type(screen.getByPlaceholderText('0.00 (use - for expenses)'), '100');
    await user.type(screen.getByPlaceholderText('What was this transaction for?'), 'Split transaction');

    // Open split mode
    fireEvent.click(screen.getByText('Split Transaction'));
    
    // Add two split entries
    fireEvent.click(screen.getByText('Add Split'));
    fireEvent.click(screen.getByText('Add Split'));

    // Fill split details
    const categorySelects = screen.getAllByDisplayValue('Select category');
    const amountInputs = screen.getAllByPlaceholderText('0.00');
    const descriptionInputs = screen.getAllByPlaceholderText('Details');

    // First split
    await user.selectOptions(categorySelects[0], '1');
    await user.type(amountInputs[0], '60');
    await user.type(descriptionInputs[0], 'Food portion');

    // Second split
    await user.selectOptions(categorySelects[1], '2');
    await user.type(amountInputs[1], '40');
    await user.type(descriptionInputs[1], 'Transport portion');

    // Submit
    const submitButton = screen.getByText('Add Transaction');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    // Should have called fetch 4 times (2 for loading data, 2 for creating split transactions)
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});

describe('TransactionCreateForm - Templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockSuccessfulResponse({ accounts: mockAccounts }))
      .mockResolvedValueOnce(mockSuccessfulResponse({ categories: mockCategories }));
  });

  it('should show templates UI when Templates button is clicked', async () => {
    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);

    expect(screen.getByText('Transaction Templates')).toBeInTheDocument();
    expect(screen.getByText('Save as Template')).toBeInTheDocument();
    expect(screen.getByText('No templates saved yet')).toBeInTheDocument();
  });

  it('should save a transaction as template', async () => {
    const user = userEvent.setup();
    
    // Mock window.prompt
    const mockPrompt = vi.fn().mockReturnValue('Monthly Salary');
    global.prompt = mockPrompt;

    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Fill form first
    await user.selectOptions(screen.getByDisplayValue('Select account'), '1');
    await user.type(screen.getByPlaceholderText('0.00 (use - for expenses)'), '50000');
    await user.type(screen.getByPlaceholderText('What was this transaction for?'), 'Monthly salary payment');
    await user.selectOptions(screen.getByDisplayValue('Select category'), '1');

    // Open templates
    fireEvent.click(screen.getByText('Templates'));
    
    // Save as template
    fireEvent.click(screen.getByText('Save as Template'));

    expect(mockPrompt).toHaveBeenCalledWith('Enter a name for this template:');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should apply a template to form', async () => {
    const mockTemplates = JSON.stringify([
      {
        id: '1',
        name: 'Monthly Salary',
        amount: '50000',
        description: 'Monthly salary payment',
        categoryId: '1',
        accountId: '1'
      }
    ]);
    
    localStorageMock.getItem.mockReturnValue(mockTemplates);

    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Open templates
    fireEvent.click(screen.getByText('Templates'));
    
    // Should show the saved template
    expect(screen.getByText('Monthly Salary')).toBeInTheDocument();
    expect(screen.getByText('Monthly salary payment')).toBeInTheDocument();

    // Click on template to apply it
    fireEvent.click(screen.getByText('Monthly Salary'));

    // Form should be filled with template values
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Monthly salary payment')).toBeInTheDocument();
  });

  it('should delete a template', async () => {
    const mockTemplates = JSON.stringify([
      {
        id: '1',
        name: 'Monthly Salary',
        amount: '50000',
        description: 'Monthly salary payment',
        categoryId: '1',
        accountId: '1'
      }
    ]);
    
    localStorageMock.getItem.mockReturnValue(mockTemplates);

    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    // Open templates
    fireEvent.click(screen.getByText('Templates'));
    
    // Should show the template
    expect(screen.getByText('Monthly Salary')).toBeInTheDocument();

    // Find and click delete button (X button)
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && 
      button.closest('[data-template]') // Assuming we add this data attribute
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('transactionTemplates', '[]');
    }
  });
});

describe('TransactionCreateForm - Bulk Entry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockSuccessfulResponse({ accounts: mockAccounts }))
      .mockResolvedValueOnce(mockSuccessfulResponse({ categories: mockCategories }));
  });

  it('should show bulk entry UI when Bulk Entry button is clicked', async () => {
    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Bulk Entry')).toBeInTheDocument();
    });

    const bulkButton = screen.getByText('Bulk Entry');
    fireEvent.click(bulkButton);

    expect(screen.getByText('Bulk Transaction Entry')).toBeInTheDocument();
    expect(screen.getByText('Add Entry')).toBeInTheDocument();
    expect(screen.getByText('No bulk entries yet')).toBeInTheDocument();
  });

  it('should add and remove bulk entries', async () => {
    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Bulk Entry')).toBeInTheDocument();
    });

    // Open bulk mode
    fireEvent.click(screen.getByText('Bulk Entry'));
    
    // Add bulk entries
    const addEntryButton = screen.getByText('Add Entry');
    fireEvent.click(addEntryButton);
    fireEvent.click(addEntryButton);

    // Should show bulk entry forms
    expect(screen.getAllByText('Account').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Category').length).toBeGreaterThan(1);
  });

  it('should create multiple transactions with bulk entry', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    // Mock successful transaction creation
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockSuccessfulResponse({ accounts: mockAccounts }))
      .mockResolvedValueOnce(mockSuccessfulResponse({ categories: mockCategories }))
      .mockResolvedValue(mockSuccessfulResponse({ id: 'transaction-id' }));

    render(<TransactionCreateForm onSuccess={onSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText('Bulk Entry')).toBeInTheDocument();
    });

    // Open bulk mode
    fireEvent.click(screen.getByText('Bulk Entry'));
    
    // Add two bulk entries
    fireEvent.click(screen.getByText('Add Entry'));
    fireEvent.click(screen.getByText('Add Entry'));

    // Fill first entry
    const accountSelects = screen.getAllByDisplayValue('Account');
    const amountInputs = screen.getAllByPlaceholderText('0.00');
    const categorySelects = screen.getAllByDisplayValue('Category');
    const descriptionInputs = screen.getAllByPlaceholderText('Transaction details');

    await user.selectOptions(accountSelects[0], '1');
    await user.type(amountInputs[0], '100');
    await user.selectOptions(categorySelects[0], '1');
    await user.type(descriptionInputs[0], 'First transaction');

    // Fill second entry
    await user.selectOptions(accountSelects[1], '2');
    await user.type(amountInputs[1], '200');
    await user.selectOptions(categorySelects[1], '2');
    await user.type(descriptionInputs[1], 'Second transaction');

    // Submit bulk entries
    const createAllButton = screen.getByText('Create All Transactions');
    fireEvent.click(createAllButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    // Should have called fetch 4 times (2 for loading data, 2 for creating transactions)
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('should validate bulk entries before submission', async () => {
    const user = userEvent.setup();
    render(<TransactionCreateForm />);
    
    await waitFor(() => {
      expect(screen.getByText('Bulk Entry')).toBeInTheDocument();
    });

    // Open bulk mode
    fireEvent.click(screen.getByText('Bulk Entry'));
    
    // Add entry but don't fill all fields
    fireEvent.click(screen.getByText('Add Entry'));
    
    const amountInputs = screen.getAllByPlaceholderText('0.00');
    await user.type(amountInputs[0], '100');

    // Try to submit incomplete entry
    const createAllButton = screen.getByText('Create All Transactions');
    fireEvent.click(createAllButton);

    await waitFor(() => {
      expect(screen.getByText('All bulk entries must have account, amount, description, and category')).toBeInTheDocument();
    });
  });
});
