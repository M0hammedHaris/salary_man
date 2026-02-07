import { z } from 'zod';

// Category type enum to match database schema
// Category type enum to match database schema
export const CategoryType = {
  INCOME: 'income',
  EXPENSE: 'expense'
} as const;

export type CategoryType = typeof CategoryType[keyof typeof CategoryType];

// Category interface for TypeScript
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  isDefault: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response schemas using Zod for validation
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name too long'),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional().default('#6366f1'),
  parentId: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name too long').optional(),
  type: z.enum(['income', 'expense']).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  parentId: z.string().optional(),
});

// Response schema for API endpoints
export const categoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['income', 'expense']),
  color: z.string(),
  icon: z.string().optional(),
  isDefault: z.boolean(),
  parentId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types derived from schemas
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

// Category type display labels
export const categoryTypeLabels: Record<CategoryType, string> = {
  [CategoryType.INCOME]: 'Income',
  [CategoryType.EXPENSE]: 'Expense'
};

// Category type icons for UI
export const categoryTypeIcons: Record<CategoryType, string> = {
  [CategoryType.INCOME]: '📈',
  [CategoryType.EXPENSE]: '📉'
};

// Default category colors
export const defaultCategoryColors = [
  '#6366f1', // indigo
  '#059669', // emerald
  '#dc2626', // red
  '#d97706', // amber
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#be185d', // pink
  '#65a30d', // lime
];

// Predefined default categories
export const defaultCategories = [
  // Income categories
  { name: 'Salary', type: CategoryType.INCOME, color: '#059669' },
  { name: 'Freelance', type: CategoryType.INCOME, color: '#0891b2' },
  { name: 'Investment', type: CategoryType.INCOME, color: '#7c3aed' },
  { name: 'Other Income', type: CategoryType.INCOME, color: '#65a30d' },

  // Expense categories
  { name: 'Food & Dining', type: CategoryType.EXPENSE, color: '#dc2626' },
  { name: 'Transportation', type: CategoryType.EXPENSE, color: '#d97706' },
  { name: 'Shopping', type: CategoryType.EXPENSE, color: '#be185d' },
  { name: 'Entertainment', type: CategoryType.EXPENSE, color: '#6366f1' },
  { name: 'Bills & Utilities', type: CategoryType.EXPENSE, color: '#059669' },
  { name: 'Healthcare', type: CategoryType.EXPENSE, color: '#7c3aed' },
  { name: 'Other Expenses', type: CategoryType.EXPENSE, color: '#0891b2' },
];
