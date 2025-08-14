import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { createCategorySchema, CategoryType } from '@/lib/types/category';
import { ZodError } from 'zod';

// GET /api/categories - Retrieve all user categories
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await repositories.categories.findByUserId(userId);
    
    // Transform categories to match API response format
    const responseCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      isDefault: category.isDefault,
      parentId: category.parentId || undefined,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }));

    return NextResponse.json({ categories: responseCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' }, 
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createCategorySchema.parse(body);
    
    // If parent ID is provided, verify it exists and belongs to user
    if (validatedData.parentId) {
      const parentCategory = await repositories.categories.findById(validatedData.parentId, userId);
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
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

    return NextResponse.json(
      { category: responseCategory, message: 'Category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
