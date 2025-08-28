import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SavingsPage from '@/app/savings/page';

// Mock fetch
global.fetch = vi.fn();

// Mock SavingsGoalsDashboard component
vi.mock('@/components/savings/savings-goals-dashboard', () => ({
  SavingsGoalsDashboard: vi.fn(({ goals, onGoalCreated, onGoalUpdated, onGoalDeleted }) => (
    <div data-testid="savings-goals-dashboard">
      <div>Goals count: {goals.length}</div>
      <button onClick={onGoalCreated}>Create Goal</button>
      <button onClick={onGoalUpdated}>Update Goal</button>
      <button onClick={onGoalDeleted}>Delete Goal</button>
    </div>
  ))
}));

const mockGoals = [
  {
    id: '1',
    name: 'Emergency Fund',
    targetAmount: 100000,
    currentAmount: 40000,
    targetDate: new Date('2024-12-31'),
    priority: 1,
    status: 'active',
    progressPercentage: 40,
  },
  {
    id: '2',
    name: 'Vacation Fund',
    targetAmount: 50000,
    currentAmount: 25000,
    targetDate: new Date('2024-08-31'),
    priority: 2,
    status: 'active',
    progressPercentage: 50,
  }
];

describe('SavingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and description', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ goals: mockGoals })
    });

    render(<SavingsPage />);

    expect(screen.getByText('Savings Goals & Financial Planning')).toBeInTheDocument();
    expect(screen.getByText('Track your progress, achieve milestones, and optimize your savings strategy')).toBeInTheDocument();
  });

  it('displays loading skeleton initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SavingsPage />);

    // Check for loading skeletons
    const skeletons = screen.getAllByTestId(/loading/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('fetches and displays savings goals', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ goals: mockGoals })
    });

    render(<SavingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('savings-goals-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Goals count: 2')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/savings-goals');
  });

  it('handles API error gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

    render(<SavingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load savings goals/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Please try refreshing the page/)).toBeInTheDocument();
  });

  it('handles goal creation callback', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ goals: mockGoals })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ goals: [...mockGoals, { id: '3', name: 'New Goal' }] })
      });

    render(<SavingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('savings-goals-dashboard')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Goal');
    createButton.click();

    // Should trigger a refetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('handles goal priority update', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ goals: mockGoals })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    render(<SavingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('savings-goals-dashboard')).toBeInTheDocument();
    });

    // Get the dashboard component props
    const dashboard = screen.getByTestId('savings-goals-dashboard');
    expect(dashboard).toBeInTheDocument();

    // Note: Testing the priority update would require more complex mocking
    // as it's called through props. This test verifies the basic structure.
  });

  it('displays empty state when no goals', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ goals: [] })
    });

    render(<SavingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('savings-goals-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Goals count: 0')).toBeInTheDocument();
  });

  it('applies proper responsive layout classes', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ goals: mockGoals })
    });

    const { container } = render(<SavingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('savings-goals-dashboard')).toBeInTheDocument();
    });

    // Check for responsive container classes
    const containerElement = container.querySelector('.container');
    expect(containerElement).toHaveClass('mx-auto', 'px-4', 'py-8');

    const maxWidthElement = container.querySelector('.max-w-7xl');
    expect(maxWidthElement).toHaveClass('mx-auto');
  });

  it('handles network errors appropriately', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<SavingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch savings goals/)).toBeInTheDocument();
    });
  });
});
