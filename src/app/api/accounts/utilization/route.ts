import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { AlertService } from '@/lib/services/alert-service';

const utilizationParamsSchema = z.object({
  accountId: z.string().uuid().optional(),
});

// GET /api/accounts/utilization - Get credit utilization for user's accounts
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId') || undefined;

    const validation = utilizationParamsSchema.safeParse({ accountId });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Get accounts (either specific account or all credit card accounts)
    const accountsQuery = accountId
      ? db.select().from(accounts).where(
          and(eq(accounts.id, accountId), eq(accounts.userId, userId))
        )
      : db.select().from(accounts).where(
          and(eq(accounts.userId, userId), eq(accounts.type, 'credit_card'))
        );

    const userAccounts = await accountsQuery;

    if (accountId && userAccounts.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Calculate utilization for each account
    const utilizationData = userAccounts.map(account => {
      const utilization = AlertService.calculateCreditUtilization(account);
      
      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        balance: account.balance,
        creditLimit: account.creditLimit,
        utilization: utilization ? {
          utilizationPercentage: utilization.utilizationPercentage.toNumber(),
          utilizationAmount: utilization.utilizationAmount.toNumber(),
          availableCredit: utilization.creditLimit.minus(utilization.utilizationAmount).toNumber(),
          creditLimit: utilization.creditLimit.toNumber()
        } : null
      };
    });

    // Filter out non-credit accounts if getting all accounts
    const creditUtilization = utilizationData.filter(data => data.utilization !== null);

    return NextResponse.json({
      data: accountId ? creditUtilization[0] || null : creditUtilization,
      summary: {
        totalAccounts: creditUtilization.length,
        averageUtilization: creditUtilization.length > 0 
          ? creditUtilization.reduce((sum, account) => sum + (account.utilization?.utilizationPercentage || 0), 0) / creditUtilization.length
          : 0,
        highestUtilization: Math.max(...creditUtilization.map(account => account.utilization?.utilizationPercentage || 0))
      }
    });

  } catch (error) {
    console.error('GET /api/accounts/utilization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
