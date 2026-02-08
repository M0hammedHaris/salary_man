import { useQuery } from '@tanstack/react-query';
import { getRecurringPaymentInsights } from '@/lib/actions/dashboard';

export interface RecurringPaymentInsightsData {
    monthlyTotal: number;
    quarterlyTotal: number;
    yearlyTotal: number;
    activePayments: number;
    upcomingPayments: number;
    missedPayments: number;
    budgetImpact: {
        totalBudget: number;
        recurringAllocation: number;
        utilizationPercentage: number;
    };
    trends: {
        monthlyChange: number;
        monthlyChangePercentage: number;
        direction: 'up' | 'down' | 'stable';
    };
    topCategories: Array<{
        category: string;
        amount: number;
        percentage: number;
    }>;
}

export function useRecurringPaymentInsights() {
    return useQuery({
        queryKey: ['recurring-payment-insights'],
        queryFn: async (): Promise<RecurringPaymentInsightsData> => {
            const data = await getRecurringPaymentInsights();
            return data as unknown as RecurringPaymentInsightsData;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - recurring payments don't change often
    });
}
