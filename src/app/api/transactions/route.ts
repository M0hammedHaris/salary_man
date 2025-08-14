import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { repositories } from '@/lib/db/repositories';
import { 
  createTransactionSchema, 
  getTransactionsQuerySchema
} from '@/lib/types/transaction';
import { ZodError } from 'zod';

// GET /api/transactions - Retrieve user transactions with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      accountId: searchParams.get('accountId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    // Validate query parameters
    const validatedQuery = getTransactionsQuerySchema.parse(queryParams);
    
    // Convert string dates to Date objects
    const filters = {
      accountId: validatedQuery.accountId,
      categoryId: validatedQuery.categoryId,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
    };

    const transactions = await repositories.transactions.findByUserId(userId, filters);
    
    // Transform transactions to match API response format
    const responseTransactions = transactions.map(transaction => ({
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
    }));

    return NextResponse.json({ 
      transactions: responseTransactions,
      count: responseTransactions.length 
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' }, 
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createTransactionSchema.parse(body);
    
    // Verify account ownership
    const account = await repositories.accounts.findById(validatedData.accountId, userId);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      );
    }

    // Verify category ownership
    const category = await repositories.categories.findById(validatedData.categoryId, userId);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    // Create transaction data
    const transactionData = {
      userId,
      accountId: validatedData.accountId,
      amount: validatedData.amount,
      description: validatedData.description,
      categoryId: validatedData.categoryId,
      transactionDate: new Date(validatedData.transactionDate),
      isRecurring: false, // Default to false, will be set by recurring payment processing
      receiptUrl: validatedData.receiptUrl || null,
    };

    // Create transaction and update account balance atomically
    const newTransaction = await repositories.transactions.createWithBalanceUpdate(transactionData);
    
    // Transform response
    const responseTransaction = {
      id: newTransaction.id,
      accountId: newTransaction.accountId,
      amount: newTransaction.amount,
      description: newTransaction.description,
      categoryId: newTransaction.categoryId,
      transactionDate: newTransaction.transactionDate.toISOString(),
      isRecurring: newTransaction.isRecurring,
      recurringPaymentId: newTransaction.recurringPaymentId || undefined,
      receiptUrl: newTransaction.receiptUrl || undefined,
      createdAt: newTransaction.createdAt.toISOString(),
      updatedAt: newTransaction.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { 
        transaction: responseTransaction, 
        message: 'Transaction created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
