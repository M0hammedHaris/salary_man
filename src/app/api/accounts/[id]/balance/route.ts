import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';

// PUT /api/accounts/[id]/balance - Recalculate and update account balance
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    
    // Verify account exists and belongs to user
    const existingAccount = await repositories.accounts.findById(params.id, userId);
    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Recalculate and update balance
    const updatedAccount = await repositories.accounts.updateAccountBalance(params.id, userId);

    if (!updatedAccount) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
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
      { 
        account: responseAccount, 
        message: 'Account balance updated successfully' 
      }
    );
  } catch (error) {
    console.error('Error updating account balance:', error);
    return NextResponse.json(
      { error: 'Failed to update account balance' },
      { status: 500 }
    );
  }
}
