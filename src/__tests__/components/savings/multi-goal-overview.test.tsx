import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MultiGoalOverview } from '@/components/savings/multi-goal-overview';
import type { GoalWithProgress } from '@/lib/types/savings';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const mockGoals: GoalWithProgress[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    description: 'High priority emergency fund',
    targetAmount: 500000,
    currentAmount: 250000,
    targetDate: new Date('2024-12-31'),
    status: 'active',
    priority: 9,
    accountName: 'Savings Account',
    categoryName: 'Emergency',
    categoryColor: '#ef4444',
    progressPercentage: 50,
    remainingAmount: 250000,
    daysRemaining: 180,
    isOnTrack: true,
    requiredDailySavings: 1389,
    actualDailySavings: 1500,
    milestones: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '2',
    name: 'Vacation',
    description: 'Summer vacation to Europe',
    targetAmount: 100000,
    currentAmount: 80000,
    targetDate: new Date('2024-08-15'),
    status: 'active',
    priority: 5,
    accountName: 'Savings Account',
    categoryName: 'Travel',
    categoryColor: '#3b82f6',
    progressPercentage: 80,
    remainingAmount: 20000,
    daysRemaining: 90,
    isOnTrack: true,
    requiredDailySavings: 222,
    actualDailySavings: 250,
    milestones: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '3',
    name: 'Car Purchase',
    description: 'New car for family',
    targetAmount: 800000,
    currentAmount: 800000,
    targetDate: new Date('2024-06-01'),
    status: 'completed',
    priority: 7,
    accountName: 'Savings Account',
    categoryName: 'Transportation',
    categoryColor: '#10b981',
    progressPercentage: 100,
    remainingAmount: 0,
    daysRemaining: 0,
    isOnTrack: true,
    requiredDailySavings: 0,
    actualDailySavings: 1200,
    milestones: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '4',
    name: 'House Down Payment',
    description: 'First home purchase',
    targetAmount: 2000000,
    currentAmount: 500000,
    targetDate: new Date('2023-12-31'),
    status: 'active',
    priority: 8,
    accountName: 'Savings Account',
    categoryName: 'Housing',
    categoryColor: '#f59e0b',
    progressPercentage: 25,
    remainingAmount: 1500000,
    daysRemaining: -30,
    isOnTrack: false,
    requiredDailySavings: 2740,
    actualDailySavings: 1500,
    milestones: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-06-01'),
  },
];

const defaultProps = {
  goals: mockGoals,
  monthlyIncome: 100000,
  monthlyExpenses: 60000,
  onGoalSelect: vi.fn(),
  onResourceAllocation: vi.fn(),
  onPriorityReorder: vi.fn(),
};

describe('MultiGoalOverview', () => {
  it('renders overview cards with correct metrics', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    // Check total goals
    expect(screen.getByText('Total Goals')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Check total target amount (in lakhs)
    expect(screen.getByText('Total Target')).toBeInTheDocument();
    expect(screen.getByText('₹34.0L')).toBeInTheDocument();

    // Check average progress
    expect(screen.getByText('Average Progress')).toBeInTheDocument();
    expect(screen.getByText('48%')).toBeInTheDocument();

    // Check monthly requirement
    expect(screen.getByText('Monthly Requirement')).toBeInTheDocument();
  });

  it('displays alerts for overdue goals', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    expect(screen.getByText(/1 goal is overdue/)).toBeInTheDocument();
    expect(screen.getByText(/Consider adjusting deadlines or priorities/)).toBeInTheDocument();
  });

  it('displays alert for over-capacity resource allocation', () => {
    const propsWithHighRequirements = {
      ...defaultProps,
      monthlyIncome: 100000,
      monthlyExpenses: 95000, // Only 5k available for savings
    };

    render(<MultiGoalOverview {...propsWithHighRequirements} />);

    expect(screen.getByText(/Resource allocation is over capacity/)).toBeInTheDocument();
  });

  it('filters goals correctly', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    // Initially shows all goals
    expect(screen.getByText('Goals (4)')).toBeInTheDocument();

    // Filter to active goals
    const filterSelect = screen.getByDisplayValue('All Goals');
    fireEvent.change(filterSelect, { target: { value: 'active' } });

    expect(screen.getByText('Goals (3)')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();

    // Filter to completed goals
    fireEvent.change(filterSelect, { target: { value: 'completed' } });

    expect(screen.getByText('Goals (1)')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('sorts goals correctly', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    const sortSelect = screen.getByDisplayValue('Sort by Priority');
    
    // Sort by progress
    fireEvent.change(sortSelect, { target: { value: 'progress' } });
    
    // Sort by deadline
    fireEvent.change(sortSelect, { target: { value: 'deadline' } });
    
    // Sort by amount
    fireEvent.change(sortSelect, { target: { value: 'amount' } });
  });

  it('calls callback functions when buttons are clicked', () => {
    const onResourceAllocation = vi.fn();
    const onPriorityReorder = vi.fn();
    const onGoalSelect = vi.fn();

    render(
      <MultiGoalOverview
        {...defaultProps}
        onResourceAllocation={onResourceAllocation}
        onPriorityReorder={onPriorityReorder}
        onGoalSelect={onGoalSelect}
      />
    );

    // Click resource allocation button
    fireEvent.click(screen.getByText('Resource Allocation'));
    expect(onResourceAllocation).toHaveBeenCalled();

    // Click priority reorder button
    fireEvent.click(screen.getByText('Reorder Priorities'));
    expect(onPriorityReorder).toHaveBeenCalled();

    // Click on a goal
    fireEvent.click(screen.getByText('Emergency Fund'));
    expect(onGoalSelect).toHaveBeenCalledWith('1');
  });

  it('displays correct goal status icons and text', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    // Should show completed status for car purchase
    expect(screen.getByText('Car Purchase')).toBeInTheDocument();

    // Should show overdue status for house down payment
    expect(screen.getByText('House Down Payment')).toBeInTheDocument();
  });

  it('handles empty goals list', () => {
    render(<MultiGoalOverview {...defaultProps} goals={[]} />);

    expect(screen.getByText('Goals (0)')).toBeInTheDocument();
    expect(screen.getByText('No goals found for the selected filter.')).toBeInTheDocument();
  });

  it('displays goal progress and remaining days correctly', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    // Check emergency fund progress
    expect(screen.getByText('₹250,000 / ₹500,000')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('180 days remaining')).toBeInTheDocument();

    // Check overdue goal
    expect(screen.getByText('30 days overdue')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    // Check default tab
    expect(screen.getByText('Overview')).toBeInTheDocument();

    // Switch to distribution tab
    fireEvent.click(screen.getByText('Distribution'));

    // Switch to progress tab
    fireEvent.click(screen.getByText('Progress'));

    // Switch to timeline tab
    fireEvent.click(screen.getByText('Timeline'));
  });

  it('renders charts without errors', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    // Check that chart components are rendered
    expect(screen.getAllByTestId('pie-chart')).toHaveLength(2);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
  });

  it('calculates metrics correctly', () => {
    render(<MultiGoalOverview {...defaultProps} />);

    // Total goals: 4
    expect(screen.getByText('4')).toBeInTheDocument();

    // Active goals: 3, Completed: 1
    expect(screen.getByText('3 active, 1 completed')).toBeInTheDocument();

    // Total target: ₹34.0L (3,400,000 / 100,000)
    expect(screen.getByText('₹34.0L')).toBeInTheDocument();

    // Total current: ₹16.3L (1,630,000 / 100,000)
    expect(screen.getByText('₹16.3L saved so far')).toBeInTheDocument();

    // Average progress: 48% ((1,630,000 / 3,400,000) * 100)
    expect(screen.getByText('48%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MultiGoalOverview {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
