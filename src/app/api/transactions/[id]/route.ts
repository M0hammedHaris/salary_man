import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { updateTransactionSchema } from '@/lib/types/transaction';
import { ZodError } from 'zod';

// GET /api/transactions/[id] - Get specific transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await repositories.transactions.findById(params.id, userId);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Transform transaction to match API response format
    const responseTransaction = {
      id: transaction.id,
      accountId: transaction.accountId,
      amount: transaction.amount,
      description: transaction.description,
      categoryId: transaction.categoryId,
      transactionDate: transaction.transactionDate.toISOString(),
      isRecurring: transaction.isRecurring,
      recurringPaymentId: transaction.recurringPaymentId || undefined,
      receiptUrl: transaction.receiptUrl || undefined,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };

    return NextResponse.json({ transaction: responseTransaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = updateTransactionSchema.parse(body);

    // Check if transaction exists and belongs to user
    const existingTransaction = await repositories.transactions.findById(params.id, userId);
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // If accountId is being changed, verify new account ownership
    if (validatedData.accountId && validatedData.accountId !== existingTransaction.accountId) {
      const account = await repositories.accounts.findById(validatedData.accountId, userId);
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found or access denied' },
          { status: 404 }
        );
      }
    }

    // If categoryId is being changed, verify category ownership
    if (validatedData.categoryId && validatedData.categoryId !== existingTransaction.categoryId) {
      const category = await repositories.categories.findById(validatedData.categoryId, userId);
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: Partial<{
      accountId: string;
      amount: string;
      description: string;
      categoryId: string;
      transactionDate: Date;
      receiptUrl: string | null;
    }> = {};
    
    if (validatedData.accountId) updateData.accountId = validatedData.accountId;
    if (validatedData.amount) updateData.amount = validatedData.amount;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.categoryId) updateData.categoryId = validatedData.categoryId;
    if (validatedData.transactionDate) updateData.transactionDate = new Date(validatedData.transactionDate);
    if (validatedData.receiptUrl !== undefined) updateData.receiptUrl = validatedData.receiptUrl || null;

    // Update transaction and balance atomically
    const updatedTransaction = await repositories.transactions.updateWithBalanceUpdate(
      params.id,
      userId,
      updateData
    );

    if (!updatedTransaction) {
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // Transform response
    const responseTransaction = {
      id: updatedTransaction.id,
      accountId: updatedTransaction.accountId,
      amount: updatedTransaction.amount,
      description: updatedTransaction.description,
      categoryId: updatedTransaction.categoryId,
      transactionDate: updatedTransaction.transactionDate.toISOString(),
      isRecurring: updatedTransaction.isRecurring,
      recurringPaymentId: updatedTransaction.recurringPaymentId || undefined,
      receiptUrl: updatedTransaction.receiptUrl || undefined,
      createdAt: updatedTransaction.createdAt.toISOString(),
      updatedAt: updatedTransaction.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { 
        transaction: responseTransaction, 
        message: 'Transaction updated successfully' 
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await repositories.transactions.findById(params.id, userId);
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Delete transaction and update account balance atomically
    const deleted = await repositories.transactions.deleteWithBalanceUpdate(params.id, userId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
