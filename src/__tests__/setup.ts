import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.CLERK_SECRET_KEY = 'sk_test_mock'

// Enhanced DOM mocking for better Radix UI support
const mockPointerCapture = {
  hasPointerCapture: vi.fn(() => false),
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
}

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id', user: { id: 'test-user-id' } })),
  useAuth: vi.fn(() => ({ userId: 'test-user-id', isLoaded: true, isSignedIn: true })),
  useUser: vi.fn(() => ({ 
    user: { 
      id: 'test-user-id', 
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
    },
    isLoaded: true,
    isSignedIn: true,
  })),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }, 'User'),
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

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}))

// Mock database connections
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
        orderBy: vi.fn(() => Promise.resolve([])),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => Promise.resolve([])),
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([])),
    })),
  },
}))

// Mock notification services
vi.mock('@/lib/services/recurring-payment-notification', () => ({
  RecurringPaymentNotificationService: {
    sendUpcomingPaymentReminders: vi.fn().mockResolvedValue({ success: true }),
    sendOverduePaymentAlerts: vi.fn().mockResolvedValue({ success: true }),
    getPendingAlerts: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children)
  },
}))

// Setup global DOM enhancements
beforeAll(() => {
  // Add pointer capture methods to all elements for Radix UI
  Object.defineProperty(Element.prototype, 'hasPointerCapture', {
    value: mockPointerCapture.hasPointerCapture,
    configurable: true,
  })
  
  Object.defineProperty(Element.prototype, 'setPointerCapture', {
    value: mockPointerCapture.setPointerCapture,
    configurable: true,
  })
  
  Object.defineProperty(Element.prototype, 'releasePointerCapture', {
    value: mockPointerCapture.releasePointerCapture,
    configurable: true,
  })

  // Mock scrollIntoView
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
  })

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
    },
    writable: true,
  })

  // Mock global fetch
  global.fetch = vi.fn()

  // Suppress console warnings in tests
  console.warn = vi.fn()
  console.error = vi.fn()
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // Reset mock implementations
  mockPointerCapture.hasPointerCapture.mockReturnValue(false)
  mockPointerCapture.setPointerCapture.mockClear()
  mockPointerCapture.releasePointerCapture.mockClear()
})

afterAll(() => {
  // Restore console methods if needed
  vi.restoreAllMocks()
})
