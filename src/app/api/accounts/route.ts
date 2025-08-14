import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { createAccountSchema, AccountType } from '@/lib/types/account';
import { ZodError } from 'zod';

// GET /api/accounts - Retrieve all user accounts
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await repositories.accounts.findByUserId(userId);
    
    // Transform accounts to match API response format
    const responseAccounts = accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      creditLimit: account.creditLimit || undefined,
      isActive: account.isActive,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }));

    return NextResponse.json({ accounts: responseAccounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' }, 
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createAccountSchema.parse(body);
    
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

    return NextResponse.json(
      { account: responseAccount, message: 'Account created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
