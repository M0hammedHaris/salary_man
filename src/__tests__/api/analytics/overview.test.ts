import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/overview/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock analytics service
vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: {
    getOverview: vi.fn(),
  },
}));

describe('/api/analytics/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost:3000/api/analytics/overview');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid query parameters', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'user_123' });

    const request = new NextRequest('http://localhost:3000/api/analytics/overview?startDate=invalid');
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should return analytics overview for valid request', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    const { AnalyticsService } = await import('@/lib/services/analytics-service');
    
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (AnalyticsService.getOverview as any).mockResolvedValue({
      totalIncome: 5000,
      totalExpenses: 3000,
      netCashFlow: 2000,
      totalAssets: 10000,
      totalLiabilities: 2000,
      netWorth: 8000,
      transactionCount: 50,
      accountCount: 3,
      averageTransactionValue: 100,
      period: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/analytics/overview?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z'
    );
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.overview).toBeDefined();
    expect(data.overview.totalIncome).toBe(5000);
    expect(data.overview.netWorth).toBe(8000);
  });

  it('should handle service errors gracefully', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    const { AnalyticsService } = await import('@/lib/services/analytics-service');
    
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (AnalyticsService.getOverview as any).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/analytics/overview?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z'
    );
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch analytics overview');
  });
});
