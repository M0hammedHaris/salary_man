import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { NavigationHeader } from '@/components/layout/navigation-header';
import { SavingsQuickAccess } from '@/components/dashboard/savings-quick-access';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>
}));

// Mock navigation menu components
vi.mock('@/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="navigation-menu">{children}</nav>
  ),
  NavigationMenuList: ({ children }: { children: React.ReactNode }) => (
    <ul>{children}</ul>
  ),
  NavigationMenuItem: ({ children }: { children: React.ReactNode }) => (
    <li>{children}</li>
  ),
  NavigationMenuLink: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
  navigationMenuTriggerStyle: () => 'nav-trigger-style'
}));

// Mock Sheet components for mobile navigation
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mobile-nav-sheet">{children}</div>
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  SheetTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

// Mock other UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props}>{children}</button>
  )
}));

vi.mock('@/components/notifications/notification-status-indicator', () => ({
  NotificationStatusIndicator: ({ className }: { className?: string }) => (
    <div className={className} data-testid="notification-indicator">•</div>
  )
}));

describe('Navigation Integration', () => {
  it('includes savings goals in navigation menu', () => {
    render(<NavigationHeader />);

    // Check for savings navigation item
    expect(screen.getByText('Savings Goals')).toBeInTheDocument();
    
    // Check for the Target icon (savings icon)
    const savingsLink = screen.getByText('Savings Goals').closest('a');
    expect(savingsLink).toHaveAttribute('href', '/savings');
  });

  it('displays all expected navigation items in correct order', () => {
    render(<NavigationHeader />);

    const expectedItems = [
      'Dashboard',
      'Analytics', 
      'Savings Goals',
      'Accounts',
      'Transactions',
      'Notifications',
      'Alerts',
      'Profile'
    ];

    expectedItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('shows SalaryMan brand logo', () => {
    render(<NavigationHeader />);

    expect(screen.getAllByText('SalaryMan')).toBeTruthy();
  });

  it('includes user button for authentication', () => {
    render(<NavigationHeader />);

    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });
});

describe('SavingsQuickAccess Component', () => {
  it('renders with default props (no active goals)', () => {
    render(<SavingsQuickAccess />);

    expect(screen.getByText('Savings Goals')).toBeInTheDocument();
    expect(screen.getByText('Track your financial goals and milestones')).toBeInTheDocument();
    expect(screen.getByText('No active goals yet')).toBeInTheDocument();
    expect(screen.getByText('Create First Goal')).toBeInTheDocument();
  });

  it('renders with active goals data', () => {
    render(
      <SavingsQuickAccess 
        activeGoalsCount={3}
        totalProgress={45.7}
        nextMilestone="Halfway Hero"
      />
    );

    expect(screen.getByText('3 Active')).toBeInTheDocument();
    expect(screen.getByText('45.7%')).toBeInTheDocument();
    expect(screen.getByText('Halfway Hero')).toBeInTheDocument();
    expect(screen.getByText('Manage Goals')).toBeInTheDocument();
  });

  it('displays progress bar with correct width', () => {
    const { container } = render(
      <SavingsQuickAccess totalProgress={60} />
    );

    const progressBar = container.querySelector('[style*="width: 60%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('links to savings page', () => {
    render(<SavingsQuickAccess />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/savings');
  });

  it('displays feature list correctly', () => {
    render(<SavingsQuickAccess />);

    expect(screen.getByText('Goal progress tracking')).toBeInTheDocument();
    expect(screen.getByText('Milestone achievements')).toBeInTheDocument();
    expect(screen.getByText('Resource allocation planning')).toBeInTheDocument();
  });

  it('handles edge case with 100% progress', () => {
    const { container } = render(
      <SavingsQuickAccess totalProgress={100} />
    );

    expect(screen.getByText('100.0%')).toBeInTheDocument();
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles edge case with progress over 100%', () => {
    const { container } = render(
      <SavingsQuickAccess totalProgress={120} />
    );

    expect(screen.getByText('120.0%')).toBeInTheDocument();
    // Progress bar should be capped at 100%
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SavingsQuickAccess className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
