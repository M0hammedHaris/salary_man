import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { RecurringPaymentService } from '@/lib/services/recurring-payment-service';

// Validation schemas
const detectionConfigSchema = z.object({
  minOccurrences: z.number().min(2).max(20).default(3),
  amountTolerancePercent: z.number().min(0).max(50).default(5),
  dateVarianceDays: z.number().min(0).max(14).default(3),
  lookbackMonths: z.number().min(1).max(24).default(12),
  confidenceThreshold: z.number().min(0.1).max(1.0).default(0.7),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for optional configuration
    let detectionConfig = {};
    try {
      const body = await request.json();
      detectionConfig = detectionConfigSchema.parse(body);
    } catch {
      // Use default configuration if no body or invalid body
      detectionConfig = detectionConfigSchema.parse({});
    }

    // Detect recurring payment patterns using service
    const detectedPatterns = await RecurringPaymentService.detectRecurringPatterns(
      userId,
      detectionConfig
    );

    return NextResponse.json({
      detectedPatterns,
      summary: {
        totalPatternsFound: detectedPatterns.length,
        newPatterns: detectedPatterns.filter(p => p.isNewPattern).length,
        existingMatches: detectedPatterns.filter(p => !p.isNewPattern).length,
        highConfidencePatterns: detectedPatterns.filter(p => p.pattern.confidence > 0.8).length,
        lowRiskPatterns: detectedPatterns.filter(p => p.riskScore < 0.3).length,
      },
      detectionConfig,
    });
  } catch (error) {
    console.error('Error detecting recurring payment patterns:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid detection configuration', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to detect recurring payment patterns' },
      { status: 500 }
    );
  }
}
