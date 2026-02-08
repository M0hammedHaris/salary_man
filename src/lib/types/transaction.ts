import { z } from 'zod';

// Transaction interface for TypeScript
export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: string; // Decimal as string for precision
  description: string;
  categoryId: string;
  transactionDate: Date;
  isRecurring: boolean;
  recurringPaymentId?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response schemas using Zod for validation
export const createTransactionSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required').trim(),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/, 'Invalid amount format').trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description too long')
    .transform(str => str.trim()),
  categoryId: z.string().min(1, 'Category ID is required').trim(),
  transactionDate: z.string().refine((dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  receiptUrl: z.string().url('Invalid URL format').optional(),
});

export const updateTransactionSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required').trim().optional(),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/, 'Invalid amount format').trim().optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description too long')
    .transform(str => str.trim())
    .optional(),
  categoryId: z.string().min(1, 'Category ID is required').trim().optional(),
  transactionDate: z.string().refine((dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }, 'Invalid date format').optional(),
  receiptUrl: z.string().url('Invalid URL format').optional(),
});

// Query parameter schema for filtering transactions
export const getTransactionsQuerySchema = z.object({
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['income', 'expense', 'all']).optional(),
  startDate: z.string().refine((dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }, 'Invalid start date format').optional(),
  endDate: z.string().refine((dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }, 'Invalid end date format').optional(),
  limit: z.string().transform((val) => parseInt(val) || 50).optional(),
  offset: z.string().transform((val) => parseInt(val) || 0).optional(),
});

// Response schema for API endpoints
export const transactionResponseSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.string(),
  description: z.string(),
  categoryId: z.string(),
  transactionDate: z.string(),
  isRecurring: z.boolean(),
  recurringPaymentId: z.string().optional(),
  receiptUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types derived from schemas
export type CreateTransactionRequest = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;

// Transaction type helpers for amount interpretation
export const isIncomeTransaction = (amount: string): boolean => {
  return parseFloat(amount) > 0;
};

export const isExpenseTransaction = (amount: string): boolean => {
  return parseFloat(amount) < 0;
};

export const formatTransactionAmount = (amount: string, currency: string = 'INR'): string => {
  const numAmount = parseFloat(amount);
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(numAmount);
};

// Transaction display helpers
export const getTransactionTypeLabel = (amount: string): string => {
  return isIncomeTransaction(amount) ? 'Income' : 'Expense';
};

export const getTransactionTypeIcon = (amount: string): string => {
  return isIncomeTransaction(amount) ? '📈' : '📉';
};

export const getTransactionAmountColor = (amount: string): string => {
  return isIncomeTransaction(amount) ? 'text-green-600' : 'text-red-600';
};
