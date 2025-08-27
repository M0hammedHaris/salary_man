import { differenceInDays, addDays } from 'date-fns';
import Decimal from 'decimal.js';
import type { PaymentFrequency } from '../db/schema';

/**
 * Utility functions for recurring payment pattern detection and analysis
 */

export interface AmountCluster {
  amount: Decimal;
  occurrences: number;
  tolerance: Decimal;
}

export interface DatePattern {
  interval: number;
  frequency: PaymentFrequency;
  variance: number;
  confidence: number;
}

/**
 * Cluster similar amounts to detect consistent payment amounts
 */
export function clusterSimilarAmounts(
  amounts: Decimal[],
  tolerancePercent: number = 5
): AmountCluster[] {
  if (amounts.length === 0) return [];

  const clusters: AmountCluster[] = [];
  const processedIndices = new Set<number>();

  for (let i = 0; i < amounts.length; i++) {
    if (processedIndices.has(i)) continue;

    const baseAmount = amounts[i];
    const tolerance = baseAmount.mul(tolerancePercent / 100);
    const cluster: AmountCluster = {
      amount: baseAmount,
      occurrences: 1,
      tolerance,
    };

    // Find similar amounts
    for (let j = i + 1; j < amounts.length; j++) {
      if (processedIndices.has(j)) continue;

      const difference = amounts[j].minus(baseAmount).abs();
      if (difference.lte(tolerance)) {
        cluster.occurrences++;
        // Update cluster amount to average
        cluster.amount = cluster.amount.plus(amounts[j]).div(2);
        processedIndices.add(j);
      }
    }

    processedIndices.add(i);
    clusters.push(cluster);
  }

  // Sort by occurrences (most frequent first)
  return clusters.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Calculate statistical metrics for date intervals
 */
export function calculateIntervalStatistics(intervals: number[]): {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
} {
  if (intervals.length === 0) {
    return { mean: 0, median: 0, standardDeviation: 0, variance: 0 };
  }

  // Sort intervals for median calculation
  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  
  // Calculate mean
  const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  
  // Calculate median
  const median = sortedIntervals.length % 2 === 0
    ? (sortedIntervals[sortedIntervals.length / 2 - 1] + sortedIntervals[sortedIntervals.length / 2]) / 2
    : sortedIntervals[Math.floor(sortedIntervals.length / 2)];
  
  // Calculate variance and standard deviation
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
  const standardDeviation = Math.sqrt(variance);

  return { mean, median, standardDeviation, variance };
}

/**
 * Detect if intervals follow a specific frequency pattern
 */
export function detectFrequencyPattern(
  dates: Date[],
  targetFrequency: PaymentFrequency,
  toleranceDays: number = 3
): { matches: number; confidence: number; averageInterval: number } {
  if (dates.length < 2) {
    return { matches: 0, confidence: 0, averageInterval: 0 };
  }

  // Expected intervals for each frequency
  const expectedIntervals = {
    weekly: 7,
    monthly: 30, // Approximate
    quarterly: 91, // Approximate (91.25 days)
    yearly: 365, // Approximate (365.25 days)
  };

  const expectedInterval = expectedIntervals[targetFrequency];
  
  // Calculate actual intervals
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    intervals.push(differenceInDays(dates[i], dates[i - 1]));
  }

  // Count intervals that match the expected frequency
  let matches = 0;

  for (const interval of intervals) {
    const deviation = Math.abs(interval - expectedInterval);
    if (deviation <= toleranceDays) {
      matches++;
    }
  }

  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const confidence = matches / intervals.length;
  
  return { matches, confidence, averageInterval };
}

/**
 * Score merchant name similarity using basic string matching
 */
export function scoreMerchantSimilarity(pattern1: string, pattern2: string): number {
  const normalized1 = pattern1.toLowerCase().trim();
  const normalized2 = pattern2.toLowerCase().trim();
  
  // Exact match
  if (normalized1 === normalized2) return 1.0;
  
  // One contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.8;
  }
  
  // Word-based similarity
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);
  
  let matchingWords = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
      matchingWords++;
    }
  }
  
  return matchingWords / totalWords;
}

/**
 * Predict next payment date with confidence interval
 */
export function predictNextPaymentDate(
  lastDate: Date,
  frequency: PaymentFrequency,
  historicalVariance: number = 0
): {
  predictedDate: Date;
  confidenceInterval: {
    earliest: Date;
    latest: Date;
  };
} {
  let predictedDate: Date;
  
  switch (frequency) {
    case 'weekly':
      predictedDate = addDays(lastDate, 7);
      break;
    case 'monthly':
      // For monthly, try to maintain the same day of month
      const nextMonth = new Date(lastDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      predictedDate = nextMonth;
      break;
    case 'quarterly':
      const nextQuarter = new Date(lastDate);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      predictedDate = nextQuarter;
      break;
    case 'yearly':
      const nextYear = new Date(lastDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      predictedDate = nextYear;
      break;
    default:
      predictedDate = addDays(lastDate, 30);
  }

  // Calculate confidence interval based on historical variance
  const varianceDays = Math.max(1, Math.round(historicalVariance));
  const confidenceInterval = {
    earliest: addDays(predictedDate, -varianceDays),
    latest: addDays(predictedDate, varianceDays),
  };

  return { predictedDate, confidenceInterval };
}

/**
 * Calculate pattern stability score based on consistency metrics
 */
export function calculatePatternStability(
  amounts: Decimal[],
  intervals: number[],
  expectedInterval: number
): {
  amountStability: number;
  timingStability: number;
  overallStability: number;
} {
  if (amounts.length === 0 || intervals.length === 0) {
    return { amountStability: 0, timingStability: 0, overallStability: 0 };
  }

  // Amount stability - coefficient of variation (lower is more stable)
  const avgAmount = amounts.reduce((sum, amount) => sum.plus(amount), new Decimal(0)).div(amounts.length);
  const amountVariance = amounts.reduce((sum, amount) => {
    const diff = amount.minus(avgAmount);
    return sum.plus(diff.mul(diff));
  }, new Decimal(0)).div(amounts.length);
  
  const amountStdDev = amountVariance.sqrt();
  const coefficientOfVariation = avgAmount.isZero() ? 1 : amountStdDev.div(avgAmount).toNumber();
  const amountStability = Math.max(0, 1 - coefficientOfVariation);

  // Timing stability - based on how close intervals are to expected interval
  const intervalDeviations = intervals.map(interval => Math.abs(interval - expectedInterval));
  const avgDeviation = intervalDeviations.reduce((sum, dev) => sum + dev, 0) / intervalDeviations.length;
  const maxAcceptableDeviation = expectedInterval * 0.2; // 20% of expected interval
  const timingStability = Math.max(0, 1 - (avgDeviation / maxAcceptableDeviation));

  // Overall stability is weighted average
  const overallStability = (amountStability * 0.6) + (timingStability * 0.4);

  return {
    amountStability: Math.max(0, Math.min(1, amountStability)),
    timingStability: Math.max(0, Math.min(1, timingStability)),
    overallStability: Math.max(0, Math.min(1, overallStability)),
  };
}

/**
 * Generate confidence score for a detected pattern
 */
export function generateConfidenceScore(params: {
  occurrences: number;
  minOccurrences: number;
  amountConsistency: number;
  timingConsistency: number;
  patternAge: number; // Days since first occurrence
  merchantSimilarity: number;
}): number {
  const {
    occurrences,
    minOccurrences,
    amountConsistency,
    timingConsistency,
    patternAge,
    merchantSimilarity,
  } = params;

  // Base confidence from occurrence count
  const occurrenceScore = Math.min(occurrences / (minOccurrences * 2), 1);
  
  // Consistency scores (already 0-1)
  const consistencyScore = (amountConsistency + timingConsistency) / 2;
  
  // Age bonus - patterns with more history are more reliable
  const ageScore = Math.min(patternAge / 365, 1); // Up to 1 year for full bonus
  
  // Merchant name consistency
  const merchantScore = merchantSimilarity;

  // Weighted combination
  const confidence = 
    (occurrenceScore * 0.3) +
    (consistencyScore * 0.4) +
    (ageScore * 0.2) +
    (merchantScore * 0.1);

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Normalize transaction description for better pattern matching
 */
export function normalizeTransactionDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/\b\d{4}[*x-]\d+\b/g, 'CARD') // Replace card numbers
    .replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, 'DATE') // Replace dates
    .replace(/\b\d+\.\d{2}\b/g, 'AMOUNT') // Replace amounts
    .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract key terms from transaction descriptions for pattern matching
 */
export function extractKeyTerms(description: string, maxTerms: number = 3): string[] {
  const normalized = normalizeTransactionDescription(description);
  const words = normalized.split(' ').filter(word => word.length > 2);
  
  // Common words to ignore
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'payment', 'auto', 'autopay',
    'subscription', 'monthly', 'annual', 'bill', 'charge', 'fee'
  ]);
  
  const significantWords = words.filter(word => !stopWords.has(word));
  
  // Return most significant terms (first few after filtering)
  return significantWords.slice(0, maxTerms);
}

/**
 * Calculate seasonal adjustment factors for recurring payments
 */
export function calculateSeasonalFactors(
  historicalAmounts: Array<{ amount: Decimal; date: Date }>,
  frequency: PaymentFrequency
): Map<number, number> {
  const seasonalFactors = new Map<number, number>();
  
  // Group by seasonal period based on frequency
  let seasonKey: (date: Date) => number;
  
  switch (frequency) {
    case 'weekly':
      // Day of week seasonality
      seasonKey = (date) => date.getDay();
      break;
    case 'monthly':
      // Month of year seasonality
      seasonKey = (date) => date.getMonth();
      break;
    case 'quarterly':
      // Quarter seasonality
      seasonKey = (date) => Math.floor(date.getMonth() / 3);
      break;
    case 'yearly':
      // No seasonal adjustment for yearly
      return seasonalFactors;
    default:
      seasonKey = (date) => date.getMonth();
  }

  // Group amounts by season
  const seasonGroups = new Map<number, Decimal[]>();
  
  for (const { amount, date } of historicalAmounts) {
    const season = seasonKey(date);
    if (!seasonGroups.has(season)) {
      seasonGroups.set(season, []);
    }
    seasonGroups.get(season)!.push(amount);
  }

  // Calculate average amount for each season
  const overallAverage = historicalAmounts
    .reduce((sum, { amount }) => sum.plus(amount), new Decimal(0))
    .div(historicalAmounts.length);

  for (const [season, amounts] of seasonGroups.entries()) {
    if (amounts.length > 0) {
      const seasonAverage = amounts
        .reduce((sum, amount) => sum.plus(amount), new Decimal(0))
        .div(amounts.length);
      
      const factor = seasonAverage.div(overallAverage).toNumber();
      seasonalFactors.set(season, factor);
    }
  }

  return seasonalFactors;
}
