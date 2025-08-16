import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import { BreadcrumbNavigation } from '@/components/layout/breadcrumb-navigation';
import '@testing-library/jest-dom';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  MoreHorizontal: () => <div data-testid="more-horizontal" />,
}));

const mockUsePathname = vi.mocked(usePathname);

describe('BreadcrumbNavigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/transactions');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render breadcrumbs for dashboard root', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<BreadcrumbNavigation />);
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render breadcrumbs for root path', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(<BreadcrumbNavigation />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumbs for transactions page', () => {
    mockUsePathname.mockReturnValue('/transactions');
    render(<BreadcrumbNavigation />);
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('renders breadcrumbs for accounts page', () => {
    mockUsePathname.mockReturnValue('/accounts');
    render(<BreadcrumbNavigation />);
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
  });

  it('renders breadcrumbs for profile page', () => {
    mockUsePathname.mockReturnValue('/profile');
    render(<BreadcrumbNavigation />);
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('uses custom breadcrumb items when provided', () => {
    const customItems = [
      { label: 'Custom', href: '/custom' },
      { label: 'Page', current: true }
    ];
    
    render(<BreadcrumbNavigation items={customItems} />);
    
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
  });

  it('renders home icon as dashboard link', () => {
    render(<BreadcrumbNavigation />);
    
    const homeIcon = screen.getByTestId('home-icon');
    const homeLink = homeIcon.closest('a');
    expect(homeLink).toHaveAttribute('href', '/dashboard');
  });

  it('marks current page correctly', () => {
    render(<BreadcrumbNavigation />);
    
    const currentPage = screen.getByText('Transactions');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });

  it('applies custom className', () => {
    const { container } = render(<BreadcrumbNavigation className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
