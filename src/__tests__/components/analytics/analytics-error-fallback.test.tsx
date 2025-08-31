/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsErrorFallback } from '@/components/analytics/analytics-error-fallback';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('AnalyticsErrorFallback', () => {
  beforeEach(() => {
    mockReload.mockClear();
  });

  it('renders error message with proper heading and description', () => {
    render(<AnalyticsErrorFallback />);
    
    expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByText(/comprehensive financial analytics and insights/i)).toBeInTheDocument();
    expect(screen.getByText(/unable to load analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/we encountered an error while loading/i)).toBeInTheDocument();
  });

  it('displays helpful error message to user', () => {
    render(<AnalyticsErrorFallback />);
    
    expect(screen.getByText(/please try refreshing the page or contact support/i)).toBeInTheDocument();
  });

  it('provides retry button with correct styling', () => {
    render(<AnalyticsErrorFallback />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toBeEnabled();
  });

  it('calls window.location.reload when retry button is clicked', async () => {
    const user = userEvent.setup();
    render(<AnalyticsErrorFallback />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);
    
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility structure with heading hierarchy', () => {
    render(<AnalyticsErrorFallback />);
    
    // Should have h1 for main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Analytics');
    
    // Should have appropriate card structure
    expect(screen.getByText(/unable to load analytics/i)).toBeInTheDocument();
  });

  it('renders with proper semantic structure', () => {
    render(<AnalyticsErrorFallback />);
    
    // Should have proper card components
    expect(screen.getByText(/unable to load analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/we encountered an error while loading your financial analytics data/i)).toBeInTheDocument();
  });
});
