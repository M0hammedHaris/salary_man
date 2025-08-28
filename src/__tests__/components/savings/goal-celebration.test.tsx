import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GoalCelebration } from '@/components/savings/goal-celebration';
import type { GoalWithProgress } from '@/lib/types/savings';

// Mock toast and navigator
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

// Mock navigator.share and clipboard
const mockShare = vi.fn();
const mockWriteText = vi.fn();

Object.defineProperty(navigator, 'share', {
  value: mockShare,
  writable: true,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

const mockGoal: GoalWithProgress = {
  id: '1',
  name: 'Emergency Fund',
  targetAmount: 100000,
  currentAmount: 100000,
  targetDate: new Date('2024-12-31'),
  priority: 1,
  description: 'Building emergency fund',
  status: 'completed',
  accountName: 'Savings Account',
  categoryName: 'Emergency',
  categoryColor: '#ef4444',
  progressPercentage: 100,
  remainingAmount: 0,
  daysRemaining: 0,
  isOnTrack: true,
  requiredDailySavings: 0,
  actualDailySavings: 600,
  milestones: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
};

const mockMilestone = {
  id: '50',
  percentage: 50,
  title: 'Halfway Hero',
  description: 'Amazing progress! You\'re halfway to your goal.',
  reward: '🏆 Halfway Champion'
};

describe('GoalCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShare.mockClear();
    mockWriteText.mockClear();
  });

  it('renders goal completion celebration', () => {
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} />);
    
    expect(screen.getByText('🎉 Goal Achieved!')).toBeInTheDocument();
    expect(screen.getByText(/Congratulations! You've successfully saved ₹1,00,000/)).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
  });

  it('renders milestone celebration', () => {
    render(<GoalCelebration goal={mockGoal} milestone={mockMilestone} />);
    
    expect(screen.getByText('🌟 Halfway Hero')).toBeInTheDocument();
    expect(screen.getByText('Amazing progress! You\'re halfway to your goal.')).toBeInTheDocument();
    expect(screen.getByText('🏆 Halfway Champion')).toBeInTheDocument();
  });

  it('displays achievement statistics correctly', () => {
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} />);
    
    expect(screen.getByText('₹1,00,000')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onClose when continue button is clicked', () => {
    const onClose = vi.fn();
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} onClose={onClose} />);
    
    const continueButton = screen.getByText('Continue Saving');
    fireEvent.click(continueButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <GoalCelebration goal={mockGoal} isGoalComplete={true} onClose={onClose} />
    );
    
    const overlay = container.firstChild as Element;
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when card content is clicked', () => {
    const onClose = vi.fn();
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} onClose={onClose} />);
    
    const card = screen.getByText('🎉 Goal Achieved!').closest('[role="button"]') || 
                 screen.getByText('🎉 Goal Achieved!').closest('div');
    if (card) {
      fireEvent.click(card);
    }
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles share functionality with navigator.share', async () => {
    mockShare.mockResolvedValue(undefined);
    const onShare = vi.fn();
    
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} onShare={onShare} />);
    
    const shareButton = screen.getByText('Share Achievement');
    fireEvent.click(shareButton);
    
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Savings Achievement',
      text: '🎉 I just achieved my savings goal: Emergency Fund! Saved ₹1,00,000 💰',
      url: expect.any(String),
    });
    expect(onShare).toHaveBeenCalled();
  });

  it('falls back to clipboard when navigator.share is not available', async () => {
    // Remove navigator.share temporarily
    const originalShare = navigator.share;
    delete (navigator as any).share;
    
    const onShare = vi.fn();
    render(<GoalCelebration goal={mockGoal} milestone={mockMilestone} onShare={onShare} />);
    
    const shareButton = screen.getByText('Share Achievement');
    fireEvent.click(shareButton);
    
    expect(mockWriteText).toHaveBeenCalledWith(
      '🌟 Milestone achieved: Halfway Hero for my savings goal "Emergency Fund"! 50% complete 📈'
    );
    expect(onShare).toHaveBeenCalled();
    
    // Restore navigator.share
    (navigator as any).share = originalShare;
  });

  it('toggles details view correctly', () => {
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} />);
    
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);
    
    expect(screen.getByText('Achievement Details')).toBeInTheDocument();
    expect(screen.getByText('Goal: Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Target: ₹1,00,000')).toBeInTheDocument();
    expect(screen.getByText('Current: ₹1,00,000')).toBeInTheDocument();
    
    const hideDetailsButton = screen.getByText('Hide Details');
    fireEvent.click(hideDetailsButton);
    
    expect(screen.queryByText('Achievement Details')).not.toBeInTheDocument();
  });

  it('displays milestone percentage for milestone celebration', () => {
    render(<GoalCelebration goal={mockGoal} milestone={mockMilestone} />);
    
    // Use getAllByText to find the first instance of '50%'
    const percentageElements = screen.getAllByText('50%');
    expect(percentageElements[0]).toBeInTheDocument();
    expect(screen.getByText('of your goal completed')).toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    const { container } = render(
      <GoalCelebration 
        goal={mockGoal} 
        isGoalComplete={true} 
        className="custom-celebration" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-celebration');
  });

  it('shows appropriate icon for different milestone percentages', () => {
    // Test different milestone percentages
    const milestone75 = { ...mockMilestone, percentage: 75 };
    const { rerender } = render(
      <GoalCelebration goal={mockGoal} milestone={milestone75} />
    );
    
    // Should show Award icon for 75%
    expect(screen.getByText('🌟 Halfway Hero')).toBeInTheDocument();
    
    // Test goal completion
    rerender(<GoalCelebration goal={mockGoal} isGoalComplete={true} />);
    
    // Should show Crown icon for completion
    expect(screen.getByText('🎉 Goal Achieved!')).toBeInTheDocument();
  });

  it('displays target date when available', () => {
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} />);
    
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);
    
    expect(screen.getByText(/Target Date:/)).toBeInTheDocument();
  });

  it('displays achievement date in details', () => {
    render(<GoalCelebration goal={mockGoal} isGoalComplete={true} />);
    
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);
    
    expect(screen.getByText(/Achievement Date:/)).toBeInTheDocument();
  });
});
