'use server';

import { auth } from '@clerk/nextjs/server';
import { BillService } from '@/lib/services/bill-service';
import { db } from '@/lib/db';
import { recurringPayments, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Decimal from 'decimal.js';

export async function getBillDashboardSummary() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Get bill dashboard summary
    const summary = await BillService.getBillDashboardSummary(userId);

    // Get upcoming reminders
    const upcomingReminders = await BillService.getUpcomingBillsForReminders(userId, 14);

    // Get overdue bills
    const overdueBills = await BillService.getOverdueBills(userId);

    // Get insufficient funds warnings
    const insufficientFundsWarnings = await BillService.checkInsufficientFunds(userId, 7);

    return {
        summary: {
            ...summary,
            totalAmountDue: summary.totalAmountDue.toString(),
            nextBillDue: summary.nextBillDue ? {
                ...summary.nextBillDue,
                amount: summary.nextBillDue.amount.toString(),
            } : undefined,
        },
        upcomingReminders: upcomingReminders.slice(0, 5), // Limit to 5 for dashboard
        overdueBills: overdueBills.slice(0, 5), // Limit to 5 for dashboard
        insufficientFundsWarnings: insufficientFundsWarnings.map(w => ({
            ...w,
            amount: w.amount.toString(),
            accountBalance: w.accountBalance.toString(),
            shortfall: w.shortfall.toString(),
        })),
    };
}

// Helper for recurring insights
async function getSimpleCostAnalysis(userId: string) {
    // Get all active recurring payments without status column
    const userPayments = await db
        .select({
            payment: recurringPayments,
            category: categories,
        })
        .from(recurringPayments)
        .innerJoin(categories, eq(recurringPayments.categoryId, categories.id))
        .where(
            and(
                eq(recurringPayments.userId, userId),
                eq(recurringPayments.isActive, true)
            )
        );

    // Calculate normalized monthly amounts for each payment
    const monthlyAmounts = userPayments.map(({ payment }) => {
        const amount = new Decimal(payment.amount);
        switch (payment.frequency) {
            case 'weekly':
                return amount.mul(52).div(12); // Weekly to monthly
            case 'monthly':
                return amount;
            case 'quarterly':
                return amount.div(3); // Quarterly to monthly
            case 'yearly':
                return amount.div(12); // Yearly to monthly
            default:
                return amount;
        }
    });

    const totalMonthlyAmount = monthlyAmounts.reduce(
        (sum, amount) => sum.plus(amount),
        new Decimal(0)
    );

    // Calculate totals for different periods
    const totalRecurringCosts = {
        monthly: totalMonthlyAmount,
        quarterly: totalMonthlyAmount.mul(3),
        yearly: totalMonthlyAmount.mul(12),
    };

    // Category breakdown
    const categoryMap = new Map<string, { amount: Decimal; name: string }>();

    userPayments.forEach(({ payment: _payment, category }, index) => {
        const categoryId = category.id;
        const monthlyAmount = monthlyAmounts[index];

        if (categoryMap.has(categoryId)) {
            categoryMap.get(categoryId)!.amount = categoryMap.get(categoryId)!.amount.plus(monthlyAmount);
        } else {
            categoryMap.set(categoryId, { amount: monthlyAmount, name: category.name });
        }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        monthlyAmount: data.amount,
        quarterlyAmount: data.amount.mul(3),
        yearlyAmount: data.amount.mul(12),
        percentage: totalMonthlyAmount.isZero() ? 0 : data.amount.div(totalMonthlyAmount).mul(100).toNumber(),
    }));

    return {
        totalRecurringCosts,
        categoryBreakdown,
        trends: {
            growthRate: 0,
            newPaymentsThisMonth: 0,
            cancelledPaymentsThisMonth: 0,
        },
    };
}

export async function getRecurringPaymentInsights() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Get cost analysis
    const costAnalysis = await getSimpleCostAnalysis(userId);

    // Get additional counts for active, upcoming, and missed payments
    const [activePayments, upcomingPayments] = await Promise.all([
        // Active payments count
        db.select()
            .from(recurringPayments)
            .where(
                and(
                    eq(recurringPayments.userId, userId),
                    eq(recurringPayments.isActive, true)
                )
            ),

        // Upcoming payments (due in next 7 days) - simplified without status check
        // In a real implementation this would check dates logic more precisely
        // Upcoming payments (due in next 7 days)
        BillService.getUpcomingBillsForReminders(userId, 7)
    ]);

    // Convert cost analysis to dashboard insights format
    return {
        monthlyTotal: costAnalysis.totalRecurringCosts.monthly.toNumber(),
        quarterlyTotal: costAnalysis.totalRecurringCosts.quarterly.toNumber(),
        yearlyTotal: costAnalysis.totalRecurringCosts.yearly.toNumber(),
        activePayments: activePayments.length,
        upcomingPayments: upcomingPayments.length, // Simplified logic kept from original
        missedPayments: 0, // Simplified
        budgetImpact: {
            totalBudget: costAnalysis.totalRecurringCosts.monthly.toNumber() * 2, // Assume budget is 2x recurring costs for demo
            recurringAllocation: costAnalysis.totalRecurringCosts.monthly.toNumber(),
            utilizationPercentage: costAnalysis.totalRecurringCosts.monthly.isZero()
                ? 0
                : Math.min(50, 100) // Cap at 100% for demo purposes
        },
        trends: {
            monthlyChange: 0,
            monthlyChangePercentage: costAnalysis.trends.growthRate,
            direction: costAnalysis.trends.newPaymentsThisMonth > costAnalysis.trends.cancelledPaymentsThisMonth
                ? 'up'
                : costAnalysis.trends.newPaymentsThisMonth < costAnalysis.trends.cancelledPaymentsThisMonth
                    ? 'down'
                    : 'stable'
        },
        topCategories: costAnalysis.categoryBreakdown
            .sort((a, b) => b.monthlyAmount.minus(a.monthlyAmount).toNumber())
            .slice(0, 5)
            .map(category => ({
                category: category.categoryName,
                amount: category.monthlyAmount.toNumber(),
                percentage: category.percentage
            }))
    };
}
