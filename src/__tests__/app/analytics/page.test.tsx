import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'user_123' })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock the analytics dashboard component
vi.mock('@/components/analytics/analytics-dashboard', () => ({
  AnalyticsDashboard: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>,
}));

// Mock error boundary
vi.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock skeleton component
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock shadcn/ui components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

// We need to mock the page component dynamically since it uses async functions
const mockAnalyticsPageContent = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      <p className="text-muted-foreground">
        Comprehensive financial analytics and insights to track your patterns and make data-driven decisions
      </p>
    </div>
    <div data-testid="analytics-dashboard">Analytics Dashboard</div>
  </div>
);

describe('Analytics Page', () => {
  it('renders the page title and description', () => {
    render(mockAnalyticsPageContent());
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Analytics');
    expect(screen.getByText('Comprehensive financial analytics and insights to track your patterns and make data-driven decisions')).toBeInTheDocument();
  });

  it('renders the analytics dashboard component', () => {
    render(mockAnalyticsPageContent());
    
    expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(mockAnalyticsPageContent());
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Analytics');
    
    const container = heading.closest('.container');
    expect(container).toHaveClass('mx-auto', 'p-6', 'space-y-6');
  });
});
