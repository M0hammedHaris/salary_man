import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Mock Clerk for testing
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
  }),
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  }),
  SignIn: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'sign-in' }, children),
  SignUp: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'sign-up' }, children),
  SignInButton: ({ children }: { children?: React.ReactNode }) => React.createElement('button', { 'data-testid': 'sign-in-button' }, children),
  SignUpButton: ({ children }: { children?: React.ReactNode }) => React.createElement('button', { 'data-testid': 'sign-up-button' }, children),
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }),
  UserProfile: () => React.createElement('div', { 'data-testid': 'user-profile' }),
  ClerkProvider: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: () => Promise.resolve({ userId: 'test-user-id' }),
  currentUser: () => Promise.resolve({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }),
  clerkMiddleware: (handler: (auth: unknown, req: unknown) => void) => handler,
  createRouteMatcher: () => () => false,
}))
