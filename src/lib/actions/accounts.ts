'use server';

import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { createAccountSchema, AccountType } from '@/lib/types/account';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export async function getUserAccounts() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const accounts = await repositories.accounts.findByUserId(userId);

    // Return accounts directly. Server Actions support Date serialization.
    // This matches the Account interface used in the client.
    return { accounts };
}

export async function createAccount(data: z.infer<typeof createAccountSchema>) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
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

    return { account: responseAccount, message: 'Account created successfully' };
}
