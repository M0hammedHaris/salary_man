"use client";

/**
 * @file error-boundary.tsx
 * @description React class-based error boundary for catching rendering errors.
 *
 * React requires a class component for error boundaries — functional components
 * cannot use `componentDidCatch` or `getDerivedStateFromError`.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 *   // With a custom fallback:
 *   <ErrorBoundary fallback={<p>Custom error UI</p>}>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 * Retry behaviour:
 *   The default fallback renders a "Retry" button that resets the boundary's
 *   error state via `setState({ hasError: false, error: null })`. This triggers
 *   a re-render of the children without a full page reload, which is the correct
 *   approach for transient rendering errors (e.g. a network request that failed
 *   and should be retried). A `window.location.reload()` would lose all React
 *   state and is unnecessarily heavy.
 *
 * Limitations:
 *   - Does NOT catch errors in event handlers (use try/catch there instead).
 *   - Does NOT catch errors in asynchronous code outside render (use React Query
 *     error states for data-fetching failures).
 *   - Does NOT catch server-side rendering errors.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI. If omitted, the default card-based UI is shown. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Called during rendering when a descendant throws.
   * Returns the new state that causes the boundary to show its fallback UI.
   * Static so it can be used as a pure function by React's reconciler.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Called after render when an error has been caught.
   * Suitable for logging to an error-reporting service (e.g. Sentry).
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI — card with error message and in-component retry
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
            <CardDescription>
              We encountered an error while loading this content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Error: {this.state.error.message}
            </p>
            {/*
              Reset the boundary state to re-attempt rendering the children.
              Uses setState (in-component reset) instead of window.location.reload()
              to avoid a full page reload that would lose all React state and
              require a round-trip to the server.
            */}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      );
    }

    // No error — render children normally
    return this.props.children;
  }
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
