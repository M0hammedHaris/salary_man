import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnalyticsQuickAccess } from '@/components/dashboard/analytics-quick-access';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  BarChart3: ({ className, ...props }: any) => (
    <div data-testid="bar-chart-3-icon" className={className} {...props} />
  ),
  TrendingUp: ({ className, ...props }: any) => (
    <div data-testid="trending-up-icon" className={className} {...props} />
  ),
  ArrowRight: ({ className, ...props }: any) => (
    <div data-testid="arrow-right-icon" className={className} {...props} />
  ),
}));

describe('AnalyticsQuickAccess', () => {
  it('renders the component with title and description', () => {
    render(<AnalyticsQuickAccess />);
    
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Get insights into your financial patterns')).toBeInTheDocument();
  });

  it('displays the New badge', () => {
    render(<AnalyticsQuickAccess />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows quick stats preview', () => {
    render(<AnalyticsQuickAccess />);
    
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    expect(screen.getByText('18.3%')).toBeInTheDocument();
  });

  it('displays feature list', () => {
    render(<AnalyticsQuickAccess />);
    
    expect(screen.getByText('Interactive cash flow charts')).toBeInTheDocument();
    expect(screen.getByText('Spending breakdown by category')).toBeInTheDocument();
    expect(screen.getByText('Net worth tracking & trends')).toBeInTheDocument();
  });

  it('has a link to the full analytics page', () => {
    render(<AnalyticsQuickAccess />);
    
    const link = screen.getByRole('link', { name: /View Full Analytics/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/analytics');
  });

  it('renders with custom className', () => {
    const { container } = render(<AnalyticsQuickAccess className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('includes accessibility icons', () => {
    render(<AnalyticsQuickAccess />);
    
    expect(screen.getByTestId('bar-chart-3-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('trending-up-icon')).toHaveLength(2);
    expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<AnalyticsQuickAccess />);
    
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
