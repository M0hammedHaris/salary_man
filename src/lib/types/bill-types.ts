import type { RecurringPayment } from '../db/schema';
import type Decimal from 'decimal.js';
import type { PaymentFrequency } from '../db/schema';

export interface TransactionPattern {
  id: string;
  accountId: string;
  merchantPattern: string;
  amounts: Decimal[];
  dates: Date[];
  frequency: PaymentFrequency;
  confidence: number;
  averageAmount: Decimal;
  lastOccurrence: Date;
  nextExpectedDate: Date;
  categoryId?: string;
}

export interface RecurringPaymentDetection {
  pattern: TransactionPattern;
  suggestedName: string;
  suggestedCategory: string;
  existingPaymentId?: string;
  isNewPattern: boolean;
  riskScore: number;
}

export interface CostAnalysis {
  projectedMonthlyCost: number;
  projectedAnnualCost: number;
  categoryBreakdown?: Record<string, number>;
  trends?: string[];
}

export interface MissedPaymentAlert {
  recurringPaymentId: string;
  paymentName: string;
  expectedAmount: number; // Changed from Decimal to number
  expectedDate: Date;
  daysOverdue: number;
  accountId: string;
  accountName: string;
  lastPaymentDate?: Date;
  missedConsecutivePayments: number;
  description?: string;
}

export interface RecurringPaymentWithPatterns extends RecurringPayment {
  detectedPatterns?: TransactionPattern[];
}

export { type RecurringPayment };
