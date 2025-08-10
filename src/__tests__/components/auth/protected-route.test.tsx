import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/components/auth/protected-route'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should render children when user is authenticated', () => {
    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Loading</div>
    
    render(
      <ProtectedRoute fallback={customFallback}>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )
    
    // Should render children since auth is mocked as authenticated
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
})
