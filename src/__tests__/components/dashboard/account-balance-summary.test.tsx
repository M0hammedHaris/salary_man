import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccountBalanceSummary } from '@/components/dashboard/account-balance-summary';

// Mock data matching the component props interface
const mockAccounts = [
  {
    id: 'account-1',
    name: 'Main Checking',
    type: 'checking',
    balance: 2500.00,
    status: 'positive' as const
  },
  {
    id: 'account-2',
    name: 'High Yield Savings',
    type: 'savings',
    balance: 15000.00,
    status: 'positive' as const
  },
  {
    id: 'account-3',
    name: 'Chase Credit Card',
    type: 'credit_card',
    balance: -850.00,
    status: 'alert' as const
  }
];

describe('AccountBalanceSummary', () => {
  it('should render account balance summary correctly', () => {
    render(
      <AccountBalanceSummary
        totalBalance={16650.00}
        checkingBalance={2500.00}
        savingsBalance={15000.00}
        creditCardBalance={-850.00}
        accounts={mockAccounts}
      />
    );

    // Check if the component title is rendered
    expect(screen.getByText('Account Summary')).toBeInTheDocument();
    
    // Check if total balance is displayed correctly
    expect(screen.getByText('₹16,650.00')).toBeInTheDocument();
    
    // Check if all account names are displayed
    expect(screen.getByText('Main Checking')).toBeInTheDocument();
    expect(screen.getByText('High Yield Savings')).toBeInTheDocument();
    expect(screen.getByText('Chase Credit Card')).toBeInTheDocument();
  });

  it('should display individual account balances correctly', () => {
    render(
      <AccountBalanceSummary
        totalBalance={16650.00}
        checkingBalance={2500.00}
        savingsBalance={15000.00}
        creditCardBalance={-850.00}
        accounts={mockAccounts}
      />
    );

    // Check if individual account balances are displayed (use getAllBy to handle duplicates)
    expect(screen.getAllByText('₹2,500.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹15,000.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('-₹850.00').length).toBeGreaterThan(0);
  });

  it('should display balance breakdown by account type', () => {
    render(
      <AccountBalanceSummary
        totalBalance={16650.00}
        checkingBalance={2500.00}
        savingsBalance={15000.00}
        creditCardBalance={-850.00}
        accounts={mockAccounts}
      />
    );

    // Check if account type labels are displayed (use getAllBy to handle duplicates)
    expect(screen.getAllByText('Checking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Savings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Credit').length).toBeGreaterThan(0);
  });

  it('should handle empty accounts array', () => {
    render(
      <AccountBalanceSummary
        totalBalance={0.00}
        checkingBalance={0.00}
        savingsBalance={0.00}
        creditCardBalance={0.00}
        accounts={[]}
      />
    );

    expect(screen.getByText('Account Summary')).toBeInTheDocument();
    // Use getAllByText for multiple ₹0.00 occurrences
    expect(screen.getAllByText('₹0.00').length).toBeGreaterThan(0);
    expect(screen.getByText('No accounts found. Add your first account to get started.')).toBeInTheDocument();
  });

  it('should show correct status indicators for accounts', () => {
    const accountsWithDifferentStatuses = [
      {
        id: 'account-1',
        name: 'Healthy Account',
        type: 'checking',
        balance: 1000.00,
        status: 'positive' as const
      },
      {
        id: 'account-2',
        name: 'Warning Account',
        type: 'savings',
        balance: 100.00,
        status: 'negative' as const
      },
      {
        id: 'account-3',
        name: 'Alert Account',
        type: 'credit_card',
        balance: -5000.00,
        status: 'alert' as const
      }
    ];

    render(
      <AccountBalanceSummary
        totalBalance={-3900.00}
        checkingBalance={1000.00}
        savingsBalance={100.00}
        creditCardBalance={-5000.00}
        accounts={accountsWithDifferentStatuses}
      />
    );

    expect(screen.getByText('Healthy Account')).toBeInTheDocument();
    expect(screen.getByText('Warning Account')).toBeInTheDocument();
    expect(screen.getByText('Alert Account')).toBeInTheDocument();
  });

  it('should display account type labels correctly', () => {
    render(
      <AccountBalanceSummary
        totalBalance={16650.00}
        checkingBalance={2500.00}
        savingsBalance={15000.00}
        creditCardBalance={-850.00}
        accounts={mockAccounts}
      />
    );

    // Check for formatted account type labels in individual accounts section (use getAllBy to handle duplicates)
    expect(screen.getAllByText('Checking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Savings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Credit Card').length).toBeGreaterThan(0);
  });

  it('should handle negative total balance correctly', () => {
    render(
      <AccountBalanceSummary
        totalBalance={-1000.00}
        checkingBalance={500.00}
        savingsBalance={0.00}
        creditCardBalance={-1500.00}
        accounts={[
          {
            id: 'account-1',
            name: 'Low Balance',
            type: 'checking',
            balance: 500.00,
            status: 'positive' as const
          },
          {
            id: 'account-2',
            name: 'High Debt',
            type: 'credit_card',
            balance: -1500.00,
            status: 'alert' as const
          }
        ]}
      />
    );

    // Should display negative total balance
    expect(screen.getByText('-₹1,000.00')).toBeInTheDocument();
  });
});
