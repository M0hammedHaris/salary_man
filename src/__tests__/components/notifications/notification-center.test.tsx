import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '../../../components/notifications/notification-center';

// Mock the API calls
global.fetch = vi.fn();

const mockNotifications = [
  {
    id: '1',
    type: 'credit_usage',
    title: 'Credit Card Alert',
    message: 'Your credit card usage is at 85%',
    priority: 'high',
    status: 'unread',
    createdAt: '2024-01-01T10:00:00Z',
    alertType: 'credit_usage',
    accountName: 'Chase Sapphire',
    utilizationPercentage: 85
  },
  {
    id: '2',
    type: 'bill_reminder',
    title: 'Bill Due Soon',
    message: 'Electric bill due in 3 days',
    priority: 'medium',
    status: 'unread',
    createdAt: '2024-01-01T09:00:00Z',
    alertType: 'bill_reminder',
    billName: 'Electric Bill',
    dueDate: '2024-01-04',
    amount: '₹2,500'
  }
];

const mockApiResponse = {
  success: true,
  notifications: mockNotifications,
  total: 2,
  unread: 2,
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  }
};

describe('NotificationCenter', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });
  });

  it('should render notification center with tabs', async () => {
    render(<NotificationCenter />);

    expect(screen.getByText('Notification Center')).toBeInTheDocument();
    expect(screen.getByText('All Notifications')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('should load and display notifications', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Credit Card Alert')).toBeInTheDocument();
      expect(screen.getByText('Bill Due Soon')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/notifications/center?page=1&limit=20');
  });

  it('should handle filtering by status', async () => {
    render(<NotificationCenter />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Credit Card Alert')).toBeInTheDocument();
    });

    // Click on Unread tab
    const unreadTab = screen.getByText('Unread');
    await user.click(unreadTab);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notifications/center?page=1&limit=20&status=unread');
    });
  });

  it('should handle bulk actions', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Credit Card Alert')).toBeInTheDocument();
    });

    // Select notifications
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Select first notification

    // Mock bulk action API
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Perform bulk action
    const markReadButton = screen.getByText('Mark as Read');
    await user.click(markReadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notifications/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: ['1'],
          action: 'mark_read'
        })
      });
    });
  });

  it('should handle search functionality', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Credit Card Alert')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search notifications...');
    await user.type(searchInput, 'credit');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notifications/center?page=1&limit=20&search=credit');
    });
  });

  it('should display notification priority correctly', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });
  });

  it('should handle empty state', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notifications: [],
        total: 0,
        unread: 0,
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      })
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('No notifications found')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('API Error'));

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    const paginatedResponse = {
      ...mockApiResponse,
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false
      }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => paginatedResponse
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notifications/center?page=2&limit=20');
    });
  });

  it('should show notification details when clicked', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Credit Card Alert')).toBeInTheDocument();
    });

    const notificationCard = screen.getByText('Credit Card Alert').closest('[data-testid="notification-card"]');
    if (notificationCard) {
      await user.click(notificationCard);
    }

    // Should show expanded details
    await waitFor(() => {
      expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });
});
