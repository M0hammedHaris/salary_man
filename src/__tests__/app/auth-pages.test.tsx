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

    it('should have proper styling container', () => {
      render(<SignInPage />)
      
      const container = screen.getByTestId('sign-in').parentElement
      expect(container).toHaveClass('w-full', 'max-w-md')
    })
  })

  describe('SignUpPage', () => {
    it('should render sign-up component', () => {
      render(<SignUpPage />)
      
      expect(screen.getByTestId('sign-up')).toBeInTheDocument()
    })

    it('should have proper styling container', () => {
      render(<SignUpPage />)
      
      const container = screen.getByTestId('sign-up').parentElement
      expect(container).toHaveClass('w-full', 'max-w-md')
    })
  })

  describe('ProfilePage', () => {
    it('should render user profile component', () => {
      render(<ProfilePage />)
      
      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
    })

    it('should have proper styling container', () => {
      render(<ProfilePage />)
      
      const container = screen.getByTestId('user-profile').parentElement
      expect(container).toHaveClass('w-full', 'max-w-4xl')
    })
  })
})
