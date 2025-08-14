import { describe, it, expect, vi } from 'vitest'
import { formatUserDisplayName, isProfileComplete } from '@/lib/auth/user-utils'
import { User, defaultUserPreferences } from '@/lib/types/user'

// Mock the currentUser function from Clerk
vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(),
}))

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  preferences: defaultUserPreferences,
}

describe('User Utilities', () => {
  describe('formatUserDisplayName', () => {
    it('should format full name when both first and last name are available', () => {
      const result = formatUserDisplayName(mockUser)
      expect(result).toBe('Test User')
    })

    it('should return first name when last name is missing', () => {
      const user = { ...mockUser, lastName: '' }
      const result = formatUserDisplayName(user)
      expect(result).toBe('Test')
    })

    it('should return email when names are missing', () => {
      const user = { ...mockUser, firstName: '', lastName: '' }
      const result = formatUserDisplayName(user)
      expect(result).toBe('test@example.com')
    })

    it('should return "User" when all info is missing', () => {
      const user = { ...mockUser, firstName: '', lastName: '', email: '' }
      const result = formatUserDisplayName(user)
      expect(result).toBe('User')
    })
  })

  describe('isProfileComplete', () => {
    it('should return true when all required fields are present', () => {
      const result = isProfileComplete(mockUser)
      expect(result).toBe(true)
    })

    it('should return false when first name is missing', () => {
      const user = { ...mockUser, firstName: '' }
      const result = isProfileComplete(user)
      expect(result).toBe(false)
    })

    it('should return false when last name is missing', () => {
      const user = { ...mockUser, lastName: '' }
      const result = isProfileComplete(user)
      expect(result).toBe(false)
    })

    it('should return false when email is missing', () => {
      const user = { ...mockUser, email: '' }
      const result = isProfileComplete(user)
      expect(result).toBe(false)
    })
  })

  describe('defaultUserPreferences', () => {
    it('should have correct default values', () => {
      expect(defaultUserPreferences).toEqual({
        currency: 'USD',
        dateFormat: 'MM/dd/yyyy',
        alertThresholds: {
          creditCard: 80,
          lowBalance: 100,
        },
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      })
    })

    it('should handle edge cases properly', () => {
    // Test that our utility functions handle edge cases
    const userWithoutEmail = {
      id: 'user_123',
      email: '',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: defaultUserPreferences
    };
    
    expect(formatUserDisplayName(userWithoutEmail)).toBe('John Doe');
    expect(isProfileComplete(userWithoutEmail)).toBe(false);
  });
  })
})
