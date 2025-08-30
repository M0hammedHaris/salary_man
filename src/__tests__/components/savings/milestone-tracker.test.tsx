import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MilestoneTracker } from '@/components/savings/milestone-tracker';
import type { GoalWithProgress } from '@/lib/types/savings';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const mockGoal: GoalWithProgress = {
  id: '1',
  name: 'Emergency Fund',
  targetAmount: 100000,
  currentAmount: 40000,
  targetDate: new Date('2024-12-31'),
  priority: 1,
  description: 'Building emergency fund',
  status: 'active',
  accountName: 'Savings Account',
  categoryName: 'Emergency',
  categoryColor: '#ef4444',
  progressPercentage: 40,
  remainingAmount: 60000,
  daysRemaining: 120,
  isOnTrack: true,
  requiredDailySavings: 500,
  actualDailySavings: 600,
  milestones: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
};

describe('MilestoneTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders milestone tracker with goal information', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    expect(screen.getByText('Milestone Progress')).toBeInTheDocument();
    expect(screen.getByText(mockGoal.name)).toBeInTheDocument();
    expect(screen.getByText('₹40,000')).toBeInTheDocument();
    expect(screen.getByText('₹1,00,000')).toBeInTheDocument();
  });

  it('displays correct milestone status for achieved milestones', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    // 25% milestone should be achieved (40% progress)
    expect(screen.getByText('First Quarter')).toBeInTheDocument();
    // Use getAllByText to handle duplicate text
    const milestoneDescriptions = screen.getAllByText('Great start! You\'ve saved 25% of your goal.');
    expect(milestoneDescriptions[0]).toBeInTheDocument();
  });

  it('shows next milestone information', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    expect(screen.getByText('Next Milestone')).toBeInTheDocument();
    expect(screen.getByText('Halfway Hero')).toBeInTheDocument();
    // Use getAllByText to handle duplicate text
    const nextMilestoneDescriptions = screen.getAllByText('Amazing progress! You\'re halfway to your goal.');
    expect(nextMilestoneDescriptions[0]).toBeInTheDocument();
  });

  it('displays progress percentage correctly', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    expect(screen.getByText('40.0% Complete')).toBeInTheDocument();
  });

  it('shows achievement summary statistics', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    expect(screen.getByText('Achievement Summary')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Achieved milestones
    expect(screen.getByText('3')).toBeInTheDocument(); // Remaining
    expect(screen.getByText('40%')).toBeInTheDocument(); // Overall progress
    // Use getAllByText to handle duplicate percentage text
    const percentageElements = screen.getAllByText('50%');
    expect(percentageElements.length).toBeGreaterThan(0); // Next target
  });

  it('calls onMilestoneAchieved when milestone is reached', async () => {
    const onMilestoneAchieved = vi.fn();
    const goalAt75Percent = { ...mockGoal, currentAmount: 75000 };
    
    const { rerender } = render(
      <MilestoneTracker goal={mockGoal} onMilestoneAchieved={onMilestoneAchieved} />
    );
    
    // Update to trigger 75% milestone
    rerender(
      <MilestoneTracker goal={goalAt75Percent} onMilestoneAchieved={onMilestoneAchieved} />
    );
    
    await waitFor(() => {
      expect(onMilestoneAchieved).toHaveBeenCalledWith('75');
    });
  });

  it('displays milestone markers on progress bar', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    // Check for milestone percentage markers
    const percentageMarkers = screen.getAllByText(/\d+%/);
    expect(percentageMarkers.length).toBeGreaterThan(0);
  });

  it('shows completed milestone with achievement badge', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    // Should show achieved badge for 25% milestone
    const achievedBadges = screen.getAllByText('Achieved');
    expect(achievedBadges.length).toBeGreaterThan(0);
  });

  it('calculates remaining amount correctly for next milestone', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    // Next milestone is 50% = 50,000, current is 40,000, so remaining is 10,000
    expect(screen.getByText('₹10,000 remaining')).toBeInTheDocument();
  });

  it('handles goal completion scenario', () => {
    const completedGoal = { ...mockGoal, currentAmount: 100000 };
    render(<MilestoneTracker goal={completedGoal} />);
    
    expect(screen.getByText('Goal Achieved!')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // All milestones achieved
    expect(screen.getByText('0')).toBeInTheDocument(); // No remaining
  });

  it('applies custom className correctly', () => {
    const { container } = render(
      <MilestoneTracker goal={mockGoal} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays milestone rewards when achieved', () => {
    render(<MilestoneTracker goal={mockGoal} />);
    
    // 25% milestone is achieved, should show reward
    // Use getAllByText to handle duplicate achievement badge text
    const achievementBadges = screen.getAllByText('🌟 Achievement Badge');
    expect(achievementBadges[0]).toBeInTheDocument();
  });
});
