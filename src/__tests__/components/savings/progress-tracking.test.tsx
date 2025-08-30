import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { GoalTimelineChart } from '@/components/savings/goal-timeline-chart';
import { GoalProgressTracker } from '@/components/savings/goal-progress-tracker';
import { SavingsRateTrend } from '@/components/savings/savings-rate-trend';
import { ResponsiveProgressVisualization } from '@/components/savings/responsive-progress-visualization';

import type { GoalWithProgress } from '@/lib/types/savings';

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Line: () => <div data-testid="chart-line" />,
  Area: () => <div data-testid="chart-area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

const mockGoal: GoalWithProgress = {
  id: 'goal-1',
  name: 'Emergency Fund',
  description: 'Build emergency fund for 6 months expenses',
  targetAmount: 100000,
  currentAmount: 25000,
  targetDate: new Date('2024-12-31'),
  priority: 1,
  status: 'active',
  accountName: 'Savings Account',
  categoryName: 'Emergency Fund',
  categoryColor: '#10b981',
  progressPercentage: 25,
  remainingAmount: 75000,
  daysRemaining: 150,
  isOnTrack: false,
  requiredDailySavings: 500,
  actualDailySavings: 450,
  milestones: [
    {
      id: 'milestone-1',
      percentage: 50,
      targetAmount: 50000,
      achievedAmount: 0,
      achievedAt: undefined,
      isAchieved: false,
      notified: false,
    },
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-15'),
};

describe('GoalTimelineChart', () => {
  it('renders timeline chart with proper structure', () => {
    render(<GoalTimelineChart goal={mockGoal} />);
    
    expect(screen.getByText('Savings Timeline')).toBeInTheDocument();
    expect(screen.getByText(/progress vs. ideal savings path/i)).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays key metrics for the goal', () => {
    render(<GoalTimelineChart goal={mockGoal} />);
    
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('₹25,000')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('₹100,000')).toBeInTheDocument();
  });

  it('shows status indicators', () => {
    render(<GoalTimelineChart goal={mockGoal} />);
    
    // Should show some status indication
    expect(screen.getByText(/behind|ahead|on track/i)).toBeInTheDocument();
  });
});

describe('GoalProgressTracker', () => {
  it('renders progress tracker with basic structure', () => {
    render(<GoalProgressTracker goal={mockGoal} />);
    
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });

  it('displays goal information', () => {
    render(<GoalProgressTracker goal={mockGoal} />);
    
    expect(screen.getByText('Days Left')).toBeInTheDocument();
    expect(screen.getAllByText('₹25,000')).toHaveLength(2); // Progress section + metrics section
    expect(screen.getAllByText('₹100,000')).toHaveLength(2); // Progress section + metrics section
  });

  it('shows status indicators', () => {
    render(<GoalProgressTracker goal={mockGoal} />);
    
    // Should show overdue status based on our mock data
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
  });
});

describe('SavingsRateTrend', () => {
  it('renders savings rate trend chart', () => {
    render(<SavingsRateTrend goal={mockGoal} />);
    
    expect(screen.getByText('Savings Rate Trend')).toBeInTheDocument();
    expect(screen.getByText(/daily savings progress/i)).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('displays performance summary', () => {
    render(<SavingsRateTrend goal={mockGoal} />);
    
    expect(screen.getByText('7-Day Average')).toBeInTheDocument();
    expect(screen.getByText('Required Rate')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('shows insights section', () => {
    render(<SavingsRateTrend goal={mockGoal} />);
    
    expect(screen.getByText('Insights')).toBeInTheDocument();
    // Should show some form of feedback
    expect(screen.getByText(/excellent|close|below/i)).toBeInTheDocument();
  });

  it('displays trend indicators', () => {
    render(<SavingsRateTrend goal={mockGoal} />);
    
    // Should have some trend indication (stable, increasing, decreasing)
    const trendElements = screen.getAllByText(/vs last week|stable trend/i);
    expect(trendElements.length).toBeGreaterThan(0);
  });
});

describe('ResponsiveProgressVisualization', () => {
  it('renders mobile tabs on small screens', () => {
    render(<ResponsiveProgressVisualization goal={mockGoal} />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  it('allows tab navigation on mobile', () => {
    render(<ResponsiveProgressVisualization goal={mockGoal} />);
    
    const timelineTab = screen.getByText('Timeline');
    fireEvent.click(timelineTab);
    
    // Should switch to timeline view - check for multiple instances
    expect(screen.getAllByText('Savings Timeline').length).toBeGreaterThan(0);
  });

  it('displays compact summary for small screens', () => {
    render(<ResponsiveProgressVisualization goal={mockGoal} />);
    
    expect(screen.getByText('Progress Summary')).toBeInTheDocument();
    expect(screen.getByText('View Detailed Analysis')).toBeInTheDocument();
  });

  it('shows components in different views', () => {
    render(<ResponsiveProgressVisualization goal={mockGoal} />);
    
    // Should render components for different screen sizes - may have multiple instances
    expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Progress').length).toBeGreaterThan(0);
  });

  it('handles collapsible sections', () => {
    render(<ResponsiveProgressVisualization goal={mockGoal} />);
    
    // Look for collapsible sections - should be present in the markup
    const progressElements = screen.getAllByText('Progress');
    expect(progressElements.length).toBeGreaterThan(0);
  });
});

describe('Progress Tracking Integration', () => {
  it('all components handle the same goal data consistently', () => {
    const { rerender } = render(<GoalTimelineChart goal={mockGoal} />);
    
    // Timeline chart should render
    expect(screen.getByText('Savings Timeline')).toBeInTheDocument();
    
    rerender(<GoalProgressTracker goal={mockGoal} />);
    
    // Progress tracker should render with same data
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    
    rerender(<SavingsRateTrend goal={mockGoal} />);
    
    // Trend chart should render
    expect(screen.getByText('Savings Rate Trend')).toBeInTheDocument();
  });

  it('components handle edge cases gracefully', () => {
    const edgeCaseGoal: GoalWithProgress = {
      ...mockGoal,
      currentAmount: 0,
      targetAmount: 1000,
      milestones: [],
      requiredDailySavings: 0,
      actualDailySavings: 0,
    };
    
    // Should render without errors even with minimal data
    render(<GoalProgressTracker goal={edgeCaseGoal} />);
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    
    render(<GoalTimelineChart goal={edgeCaseGoal} />);
    expect(screen.getAllByText('Savings Timeline').length).toBeGreaterThan(0);
    
    render(<SavingsRateTrend goal={edgeCaseGoal} />);
    expect(screen.getByText('Savings Rate Trend')).toBeInTheDocument();
  });
});
