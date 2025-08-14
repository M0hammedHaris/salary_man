import { z } from 'zod';

// Account type enum to match database schema
export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  CREDIT_CARD = 'credit_card',
  OTHER = 'other'
}

// Account interface for TypeScript
export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: string; // Decimal as string for precision
  creditLimit?: string; // Optional for credit cards
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response schemas using Zod for validation
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name too long'),
  type: z.enum(['checking', 'savings', 'investment', 'credit_card', 'other']),
  balance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid balance format').transform((val: string) => val),
  creditLimit: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid credit limit format').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name too long').optional(),
  type: z.enum(['checking', 'savings', 'investment', 'credit_card', 'other']).optional(),
  creditLimit: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid credit limit format').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  // Note: balance is intentionally excluded from updates to protect historical data
});

// Response schema for API endpoints
export const accountResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['checking', 'savings', 'investment', 'credit_card', 'other']),
  balance: z.string(),
  creditLimit: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types derived from schemas
export type CreateAccountRequest = z.infer<typeof createAccountSchema>;
export type UpdateAccountRequest = z.infer<typeof updateAccountSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;

// Account type display labels
export const accountTypeLabels: Record<AccountType, string> = {
  [AccountType.CHECKING]: 'Checking',
  [AccountType.SAVINGS]: 'Savings',
  [AccountType.INVESTMENT]: 'Investment',
  [AccountType.CREDIT_CARD]: 'Credit Card',
  [AccountType.OTHER]: 'Other'
};

// Account type icons for UI
export const accountTypeIcons: Record<AccountType, string> = {
  [AccountType.CHECKING]: '💳',
  [AccountType.SAVINGS]: '💰',
  [AccountType.INVESTMENT]: '📈',
  [AccountType.CREDIT_CARD]: '💸',
  [AccountType.OTHER]: '🏦'
};
