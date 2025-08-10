import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignInPage from '@/app/sign-in/[[...sign-in]]/page'
import SignUpPage from '@/app/sign-up/[[...sign-up]]/page'
import ProfilePage from '@/app/profile/[[...profile]]/page'

describe('Authentication Pages', () => {
  describe('SignInPage', () => {
    it('should render sign-in component', () => {
      render(<SignInPage />)
      
      expect(screen.getByTestId('sign-in')).toBeInTheDocument()
    })

    it('should have shadcn card structure', () => {
      render(<SignInPage />)
      
      // Check for the card structure that wraps the Clerk component
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your SalaryMan account to manage your finances securely')).toBeInTheDocument()
    })
  })

  describe('SignUpPage', () => {
    it('should render sign-up component', () => {
      render(<SignUpPage />)
      
      expect(screen.getByTestId('sign-up')).toBeInTheDocument()
    })

    it('should have shadcn card structure', () => {
      render(<SignUpPage />)
      
      // Check for the card structure that wraps the Clerk component
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Join SalaryMan today and take control of your financial future')).toBeInTheDocument()
    })
  })

  describe('ProfilePage', () => {
    it('should render user profile component', () => {
      render(<ProfilePage />)
      
      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
    })

    it('should have shadcn card structure', () => {
      render(<ProfilePage />)
      
      // Check for the card structure that wraps the Clerk component
      expect(screen.getByText('Profile Settings')).toBeInTheDocument()
      expect(screen.getByText('Manage your account settings and personal information')).toBeInTheDocument()
    })
  })
})
