import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuthState, useUserDisplayName, useProfileComplete } from '@/lib/hooks/use-auth'

// Mock component to test hooks
function TestComponent() {
  const { isLoaded, isSignedIn, userId, user, isLoading } = useAuthState()
  const displayName = useUserDisplayName()
  const isComplete = useProfileComplete()

  return (
    <div>
      <div data-testid="is-loaded">{isLoaded.toString()}</div>
      <div data-testid="is-signed-in">{isSignedIn.toString()}</div>
      <div data-testid="user-id">{userId || 'none'}</div>
      <div data-testid="user-email">{user?.email || 'none'}</div>
      <div data-testid="display-name">{displayName}</div>
      <div data-testid="is-complete">{isComplete.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
    </div>
  )
}

describe('Authentication Hooks', () => {
  it('should return correct auth state when user is signed in', () => {
    render(<TestComponent />)
    
    expect(screen.getByTestId('is-loaded')).toHaveTextContent('true')
    expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true')
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-id')
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
  })

  it('should return correct display name', () => {
    render(<TestComponent />)
    
    expect(screen.getByTestId('display-name')).toHaveTextContent('Test User')
  })

  it('should correctly check if profile is complete', () => {
    render(<TestComponent />)
    
    expect(screen.getByTestId('is-complete')).toHaveTextContent('true')
  })
})
