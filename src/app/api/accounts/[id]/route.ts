import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { updateAccountSchema } from '@/lib/types/account';
import { ZodError } from 'zod';

// GET /api/accounts/[id] - Get specific account
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await repositories.accounts.findById(params.id, userId);
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Transform account to match API response format
    const responseAccount = {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      creditLimit: account.creditLimit || undefined,
      isActive: account.isActive,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };

    return NextResponse.json({ account: responseAccount });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' }, 
      { status: 500 }
    );
  }
}

// PUT /api/accounts/[id] - Update account (with balance protection)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify account exists and belongs to user
    const existingAccount = await repositories.accounts.findById(params.id, userId);
    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate request body (note: balance is excluded from update schema)
    const validatedData = updateAccountSchema.parse(body);
    
    // Update account
    const updatedAccount = await repositories.accounts.update(
      params.id, 
      userId, 
      validatedData
    );

    if (!updatedAccount) {
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
    
    // Transform response
    const responseAccount = {
      id: updatedAccount.id,
      name: updatedAccount.name,
      type: updatedAccount.type,
      balance: updatedAccount.balance,
      creditLimit: updatedAccount.creditLimit || undefined,
      isActive: updatedAccount.isActive,
      createdAt: updatedAccount.createdAt.toISOString(),
      updatedAt: updatedAccount.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { account: responseAccount, message: 'Account updated successfully' }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Delete account with transaction dependency check
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify account exists and belongs to user
    const existingAccount = await repositories.accounts.findById(params.id, userId);
    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if account has transactions
    const hasTransactions = await repositories.accounts.hasTransactions(params.id, userId);
    
    if (hasTransactions) {
      return NextResponse.json(
        { 
          error: 'Cannot delete account with existing transactions',
          message: 'This account has transaction history and cannot be deleted. Consider deactivating it instead.'
        },
        { status: 409 } // Conflict status
      );
    }

    // Soft delete the account
    const success = await repositories.accounts.delete(params.id, userId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
