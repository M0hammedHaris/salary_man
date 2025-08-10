import { render, screen } from '@testing-library/react';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { TooltipProvider } from '@/components/ui/tooltip';

// Wrapper component with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider>{children}</TooltipProvider>
);

describe('FinancialHealthScore', () => {
  const defaultProps = {
    score: 75,
    trend: 'up' as const,
    explanation: 'Your score is based on account balances and credit utilization.',
  };

  it('renders financial health score correctly', () => {
    render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Financial Health Score')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('up')).toBeInTheDocument();
  });

  it('displays excellent label for high scores', () => {
    render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} score={85} />
      </TestWrapper>
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('displays fair label for medium scores', () => {
    render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} score={50} />
      </TestWrapper>
    );

    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('displays needs attention label for low scores', () => {
    render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} score={30} />
      </TestWrapper>
    );

    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });

  it('shows correct trend indicators', () => {
    const { rerender } = render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} trend="down" />
      </TestWrapper>
    );

    expect(screen.getByText('down')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} trend="stable" />
      </TestWrapper>
    );

    expect(screen.getByText('stable')).toBeInTheDocument();
  });

  it('applies correct color styling based on score', () => {
    const { rerender } = render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} score={80} />
      </TestWrapper>
    );

    // High score should have green color
    expect(screen.getByText('80')).toHaveClass('text-green-600');

    rerender(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} score={50} />
      </TestWrapper>
    );

    // Medium score should have yellow color
    expect(screen.getByText('50')).toHaveClass('text-yellow-600');

    rerender(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} score={30} />
      </TestWrapper>
    );

    // Low score should have red color
    expect(screen.getByText('30')).toHaveClass('text-red-600');
  });

  it('renders progress bar with correct width', () => {
    render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} score={75} />
      </TestWrapper>
    );

    const progressBar = screen.getByText('75').closest('[data-slot="card-content"]')?.querySelector('[style*="width: 75%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays tooltip with explanation', () => {
    render(
      <TestWrapper>
        <FinancialHealthScore {...defaultProps} />
      </TestWrapper>
    );

    // Check that tooltip trigger (info icon) is present using data attribute
    const infoIcon = screen.getByText('Financial Health Score').parentElement?.querySelector('[data-slot="tooltip-trigger"]');
    expect(infoIcon).toBeInTheDocument();
  });
});
