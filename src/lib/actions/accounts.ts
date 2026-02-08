'use server';

import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { createAccountSchema, AccountType } from '@/lib/types/account';
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

export async function getUserAccounts(): Promise<ActionResponse<{ accounts: unknown[] }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to continue',
      };
    }

    const accounts = await repositories.accounts.findByUserId(userId);

    return {
      success: true,
      data: { accounts },
    };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return {
      success: false,
      error: 'Failed to fetch accounts',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createAccount(
  data: z.infer<typeof createAccountSchema>
): Promise<ActionResponse<{ account: unknown }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to continue',
      };
    }

    // Validate request body
    const validatedData = createAccountSchema.parse(data);

    // Create account data
    const accountData = {
      userId,
      name: validatedData.name,
      type: validatedData.type as AccountType,
      balance: validatedData.balance,
      creditLimit: validatedData.creditLimit || null,
      isActive: true,
    };

    const newAccount = await repositories.accounts.create(accountData);

    // Transform response
    const responseAccount = {
      id: newAccount.id,
      name: newAccount.name,
      type: newAccount.type,
      balance: newAccount.balance,
      creditLimit: newAccount.creditLimit || undefined,
      isActive: newAccount.isActive,
      createdAt: newAccount.createdAt.toISOString(),
      updatedAt: newAccount.updatedAt.toISOString(),
    };

    revalidatePath('/dashboard');
    revalidatePath('/accounts');

    return {
      success: true,
      data: { account: responseAccount },
      message: 'Account created successfully',
    };
  } catch (error) {
    console.error('Error creating account:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      };
    }

    return {
      success: false,
      error: 'Failed to create account',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
