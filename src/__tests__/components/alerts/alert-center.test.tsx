import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertCenter } from '@/components/alerts/alert-center';

// Mock formatDistanceToNow from date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

describe('AlertCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render alert center with default props', () => {
    render(<AlertCenter />);
    
    expect(screen.getByText('Alert Center')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should display mock alerts', () => {
    render(<AlertCenter />);
    
    // Should show alert titles
    expect(screen.getByText('Credit Utilization Alert')).toBeInTheDocument();
    expect(screen.getByText('High Credit Utilization')).toBeInTheDocument();
    expect(screen.getByText('Utilization Decreased')).toBeInTheDocument();
  });

  it('should filter alerts by unread status', async () => {
    const user = userEvent.setup();
    render(<AlertCenter />);
    
    // Click on unread filter
    await user.click(screen.getByText('Unread'));
    
    // Should only show unread alerts
    expect(screen.getByText('Credit Utilization Alert')).toBeInTheDocument();
    
    // Should not show read alerts
    expect(screen.queryByText('Utilization Decreased')).not.toBeInTheDocument();
  });

  it('should filter alerts by acknowledged status', async () => {
    const user = userEvent.setup();
    render(<AlertCenter />);
    
    // Click on archived filter
    await user.click(screen.getByText('Archived'));
    
    // Should only show acknowledged alerts
    expect(screen.getByText('Utilization Decreased')).toBeInTheDocument();
    
    // Should not show unacknowledged alerts
    expect(screen.queryByText('Credit Utilization Alert')).not.toBeInTheDocument();
  });

  it('should acknowledge an alert when acknowledge button is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertCenter />);
    
    // Find and click acknowledge button for first alert
    const acknowledgeButtons = screen.getAllByText('Acknowledge');
    await user.click(acknowledgeButtons[0]);
    
    // Alert should now show as acknowledged
    await waitFor(() => {
      expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();
    });
  });

  it('should snooze an alert when snooze button is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertCenter />);
    
    // Find and click snooze button for first alert
    const snoozeButtons = screen.getAllByText('Snooze 24h');
    await user.click(snoozeButtons[0]);
    
    // Alert should be snoozed (less visible)
    await waitFor(() => {
      const alertElement = screen.getByText('Credit Utilization Alert').closest('div');
      expect(alertElement).toHaveClass('opacity-60');
    });
  });

  it('should dismiss an alert when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertCenter />);
    
    // Count initial alerts
    const initialAlerts = screen.getAllByText(/Credit/);
    const initialCount = initialAlerts.length;
    
    // Find and click dismiss button (X button) for first alert
    const dismissButtons = screen.getAllByRole('button');
    const dismissButton = dismissButtons.find(button => 
      button.textContent === '' && button.querySelector('svg')
    );
    
    if (dismissButton) {
      await user.click(dismissButton);
      
      // Alert should be removed
      await waitFor(() => {
        const remainingAlerts = screen.getAllByText(/Credit|Utilization/);
        expect(remainingAlerts.length).toBeLessThan(initialCount);
      });
    }
  });

  it('should display utilization information for each alert', () => {
    render(<AlertCenter />);
    
    // Should show utilization percentages
    expect(screen.getByText('75.5%')).toBeInTheDocument();
    expect(screen.getByText('92.3%')).toBeInTheDocument();
    expect(screen.getByText('45.2%')).toBeInTheDocument();
    
    // Should show balance information
    expect(screen.getByText('₹75,500')).toBeInTheDocument();
    expect(screen.getByText('₹1,38,450')).toBeInTheDocument();
    expect(screen.getByText('₹45,200')).toBeInTheDocument();
  });

  it('should show unread indicator badge', () => {
    render(<AlertCenter />);
    
    // Should show unread count badge (2 unread alerts in mock data)
    const badge = screen.getByText('1'); // One unread alert in the mock
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-destructive');
  });

  it('should render with custom props', () => {
    render(
      <AlertCenter 
        showFilter={false} 
        showSettings={false} 
        maxHeight="400px"
      />
    );
    
    // Should not show filter buttons when showFilter is false
    expect(screen.queryByText('All')).not.toBeInTheDocument();
    expect(screen.queryByText('Unread')).not.toBeInTheDocument();
    
    // Should not show settings button when showSettings is false
    const settingsButton = screen.queryByRole('button', { name: /settings/i });
    expect(settingsButton).not.toBeInTheDocument();
  });

  it('should display proper severity indicators', () => {
    render(<AlertCenter />);
    
    // Should have different colored indicators for different severities
    const alertElements = screen.getAllByText(/Credit Utilization|High Credit|Utilization Decreased/);
    
    // Each alert should have its parent container with appropriate styling
    alertElements.forEach(alert => {
      const container = alert.closest('div');
      expect(container).toHaveClass(/border-/); // Should have border color class
      expect(container).toHaveClass(/bg-/); // Should have background color class
    });
  });

  it('should mark alerts as read when clicked', async () => {
    const user = userEvent.setup();
    render(<AlertCenter />);
    
    // Find an unread alert (should have font-semibold)
    const unreadAlert = screen.getByText('Credit Utilization Alert');
    const container = unreadAlert.closest('div');
    
    // Click on the alert
    if (container) {
      await user.click(container);
      
      // Should remove the unread indicator
      await waitFor(() => {
        const titleElement = screen.getByText('Credit Utilization Alert');
        expect(titleElement).not.toHaveClass('font-semibold');
      });
    }
  });
});
