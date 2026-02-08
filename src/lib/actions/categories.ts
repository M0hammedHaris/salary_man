'use server';

import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { createCategorySchema, CategoryType } from '@/lib/types/category';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Standardized response types
type ActionSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

type ActionError = {
  success: false;
  error: string;
  details?: unknown;
};

type ActionResponse<T> = ActionSuccess<T> | ActionError;

export async function getUserCategories(): Promise<ActionResponse<{ categories: unknown[] }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to continue',
      };
    }

    const categories = await repositories.categories.findByUserId(userId);

    return {
      success: true,
      data: { categories },
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createCategory(
  data: z.infer<typeof createCategorySchema>
): Promise<ActionResponse<{ category: unknown }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to continue',
      };
    }

    // Validate request body
    const validatedData = createCategorySchema.parse(data);

    // If parent ID is provided, verify it exists and belongs to user
    if (validatedData.parentId) {
      const parentCategory = await repositories.categories.findById(validatedData.parentId, userId);
      if (!parentCategory) {
        return {
          success: false,
          error: 'Parent category not found',
        };
      }
    }

    // Create category data
    const categoryData = {
      userId,
      name: validatedData.name,
      type: validatedData.type as CategoryType,
      color: validatedData.color,
      isDefault: false, // User-created categories are never default
      parentId: validatedData.parentId || null,
    };

    const newCategory = await repositories.categories.create(categoryData);

    // Transform response
    const responseCategory = {
      id: newCategory.id,
      name: newCategory.name,
      type: newCategory.type,
      color: newCategory.color,
      isDefault: newCategory.isDefault,
      parentId: newCategory.parentId || undefined,
      createdAt: newCategory.createdAt.toISOString(),
      updatedAt: newCategory.updatedAt.toISOString(),
    };

    revalidatePath('/dashboard');
    revalidatePath('/categories');

    return {
      success: true,
      data: { category: responseCategory },
      message: 'Category created successfully',
    };
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      };
    }

    return {
      success: false,
      error: 'Failed to create category',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
