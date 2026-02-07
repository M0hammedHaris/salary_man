'use server';

import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { createCategorySchema, CategoryType } from '@/lib/types/category';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export async function getUserCategories() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const categories = await repositories.categories.findByUserId(userId);

    // Return categories directly. Server Actions support Date serialization.
    return { categories };
}

export async function createCategory(data: z.infer<typeof createCategorySchema>) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Validate request body
    const validatedData = createCategorySchema.parse(data);

    // If parent ID is provided, verify it exists and belongs to user
    if (validatedData.parentId) {
        const parentCategory = await repositories.categories.findById(validatedData.parentId, userId);
        if (!parentCategory) {
            throw new Error('Parent category not found');
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

    return { category: responseCategory, message: 'Category created successfully' };
}
