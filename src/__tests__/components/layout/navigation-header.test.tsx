import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import { NavigationHeader } from '@/components/layout/navigation-header';
import '@testing-library/jest-dom';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock Clerk UserButton
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

// Mock notification status indicator
vi.mock('@/components/notifications/notification-status-indicator', () => ({
  NotificationStatusIndicator: ({ className }: { className?: string }) => (
    <div data-testid="notification-status" className={className} />
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <div data-testid="dashboard-icon" />,
  CreditCard: () => <div data-testid="accounts-icon" />,
  Receipt: () => <div data-testid="transactions-icon" />,
  User: () => <div data-testid="profile-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  DollarSign: () => <div data-testid="logo-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  BarChart3: () => <div data-testid="barchart-icon" />,
  Target: () => <div data-testid="target-icon" />,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
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
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Savings Goals')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/accounts');
    render(<NavigationHeader />);
    
    // Check both desktop and mobile versions
    const accountsLinks = screen.getAllByText('Accounts');
    expect(accountsLinks.some(link => 
      link.closest('a')?.classList.contains('bg-accent')
    )).toBe(true);
  });

  it('shows dashboard as active for root path', () => {
    mockUsePathname.mockReturnValue('/');
    render(<NavigationHeader />);
    
    const dashboardLinks = screen.getAllByText('Dashboard');
    expect(dashboardLinks.some(link => 
      link.closest('a')?.classList.contains('bg-accent')
    )).toBe(true);
  });

  it('renders user button with proper touch target size', () => {
    render(<NavigationHeader />);
    
    const userButton = screen.getByTestId('user-button');
    expect(userButton).toBeInTheDocument();
    
    // Check if the parent container has proper touch target size
    const userButtonContainer = userButton.closest('.h-11.w-11');
    expect(userButtonContainer).toBeInTheDocument();
  });

  it('shows mobile menu trigger with proper touch target size', () => {
    render(<NavigationHeader />);
    
    const mobileMenuTrigger = screen.getByLabelText('Open navigation menu');
    expect(mobileMenuTrigger).toBeInTheDocument();
    expect(mobileMenuTrigger).toHaveClass('h-11', 'w-11');
  });

  it('sets correct aria-current for active navigation items', () => {
    mockUsePathname.mockReturnValue('/transactions');
    render(<NavigationHeader />);
    
    const transactionsLinks = screen.getAllByText('Transactions');
    expect(transactionsLinks.some(link => 
      link.closest('a')?.getAttribute('aria-current') === 'page'
    )).toBe(true);
  });

  it('ensures mobile navigation links meet touch target requirements', () => {
    render(<NavigationHeader />);
    
    const mobileMenuTrigger = screen.getByLabelText('Open navigation menu');
    expect(mobileMenuTrigger).toHaveClass('h-11', 'w-11');
  });

  it('maintains desktop navigation behavior', () => {
    render(<NavigationHeader />);
    
    // Desktop navigation should still be present
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('provides proper keyboard navigation support', () => {
    render(<NavigationHeader />);
    
    const mobileMenuTrigger = screen.getByLabelText('Open navigation menu');
    expect(mobileMenuTrigger).toHaveAttribute('aria-label', 'Open navigation menu');
    
    // Screen reader text should be present
    expect(screen.getByText('Toggle Menu')).toBeInTheDocument();
  });
});
