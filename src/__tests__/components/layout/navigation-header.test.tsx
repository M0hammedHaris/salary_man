import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import { NavigationHeader } from '@/components/layout/navigation-header';
import '@testing-library/jest-dom';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <div data-testid="dashboard-icon" />,
  CreditCard: () => <div data-testid="accounts-icon" />,
  Receipt: () => <div data-testid="transactions-icon" />,
  User: () => <div data-testid="profile-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  DollarSign: () => <div data-testid="logo-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
}));

const mockUsePathname = vi.mocked(usePathname);

describe('NavigationHeader', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the navigation header with logo', () => {
    render(<NavigationHeader />);
    
    expect(screen.getByText('SalaryMan')).toBeInTheDocument();
    expect(screen.getByTestId('logo-icon')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<NavigationHeader />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/accounts');
    render(<NavigationHeader />);
    
    const accountsLink = screen.getByRole('link', { name: /accounts/i });
    expect(accountsLink).toHaveClass('bg-accent');
  });

  it('shows dashboard as active for root path', () => {
    mockUsePathname.mockReturnValue('/');
    render(<NavigationHeader />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('bg-accent');
  });

  it('renders user button', () => {
    render(<NavigationHeader />);
    
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });

  it('shows mobile menu trigger on smaller screens', () => {
    render(<NavigationHeader />);
    
    const mobileMenuTrigger = screen.getByLabelText('Open navigation menu');
    expect(mobileMenuTrigger).toBeInTheDocument();
  });

  it('sets correct aria-current for active navigation items', () => {
    mockUsePathname.mockReturnValue('/transactions');
    render(<NavigationHeader />);
    
    const transactionsLink = screen.getByRole('link', { name: /transactions/i });
    expect(transactionsLink).toHaveAttribute('aria-current', 'page');
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).not.toHaveAttribute('aria-current');
  });
});
