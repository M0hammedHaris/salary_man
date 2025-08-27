import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GET } from '../../../app/api/cron/bill-reminders/route';
import { BillService, type BillProcessingResult } from '../../../lib/services/bill-service';
import { type Alert } from '../../../lib/db/schema';
import { NextRequest } from 'next/server';
import Decimal from 'decimal.js';

// Mock the BillService
vi.mock('../../../lib/services/bill-service', () => ({
  BillService: {
    processDailyBillReminders: vi.fn(),
  },
}));

describe('Bill Reminders Cron Job API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
  });

  test('should successfully process bill reminders', async () => {
    // Mock successful processing
    const mockResult: BillProcessingResult = {
      processedBills: 5,
      triggeredReminders: 3,
      createdAlerts: [
        { id: '1' } as Alert, 
        { id: '2' } as Alert, 
        { id: '3' } as Alert
      ],
      insufficientFundsWarnings: [
        { 
          billId: 'bill1', 
          billName: 'Credit Card', 
          amount: new Decimal(500),
          dueDate: new Date(),
          accountBalance: new Decimal(400),
          shortfall: new Decimal(100)
        }
      ],
    };

    vi.mocked(BillService.processDailyBillReminders).mockResolvedValue(mockResult);

    const request = new NextRequest('http://localhost:3000/api/cron/bill-reminders');
    const response = await GET(request);

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toEqual({
      success: true,
      processedCount: 3,
      totalPayments: 5,
      createdAlerts: 3,
      insufficientFundsWarnings: 1,
      details: {
        processedBills: 5,
        triggeredReminders: 3,
        insufficientFundsWarnings: 1,
      },
    });

    expect(BillService.processDailyBillReminders).toHaveBeenCalledOnce();
  });

  test('should handle processing errors gracefully', async () => {
    // Mock processing error
    const error = new Error('Database connection failed');
    vi.mocked(BillService.processDailyBillReminders).mockRejectedValue(error);

    const request = new NextRequest('http://localhost:3000/api/cron/bill-reminders');
    const response = await GET(request);

    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toEqual({
      error: 'Internal server error',
      message: 'Database connection failed',
    });
  });

  test('should reject unauthorized requests in production', async () => {
    // Set production environment
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'test-secret');

    const request = new NextRequest('http://localhost:3000/api/cron/bill-reminders');
    const response = await GET(request);

    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data).toEqual({
      error: 'Unauthorized',
    });

    expect(BillService.processDailyBillReminders).not.toHaveBeenCalled();
  });

  test('should allow authorized requests in production', async () => {
    // Set production environment
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'test-secret');

    const mockResult: BillProcessingResult = {
      processedBills: 2,
      triggeredReminders: 1,
      createdAlerts: [{ id: '1' } as Alert],
      insufficientFundsWarnings: [],
    };

    vi.mocked(BillService.processDailyBillReminders).mockResolvedValue(mockResult);

    const request = new NextRequest('http://localhost:3000/api/cron/bill-reminders', {
      headers: {
        authorization: 'Bearer test-secret',
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(BillService.processDailyBillReminders).toHaveBeenCalledOnce();
  });

  test('should handle empty processing results', async () => {
    // Mock empty results
    const mockResult: BillProcessingResult = {
      processedBills: 0,
      triggeredReminders: 0,
      createdAlerts: [],
      insufficientFundsWarnings: [],
    };

    vi.mocked(BillService.processDailyBillReminders).mockResolvedValue(mockResult);

    const request = new NextRequest('http://localhost:3000/api/cron/bill-reminders');
    const response = await GET(request);

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toEqual({
      success: true,
      processedCount: 0,
      totalPayments: 0,
      createdAlerts: 0,
      insufficientFundsWarnings: 0,
      details: {
        processedBills: 0,
        triggeredReminders: 0,
        insufficientFundsWarnings: 0,
      },
    });
  });

  test('should handle non-Error exceptions', async () => {
    // Mock non-Error exception
    vi.mocked(BillService.processDailyBillReminders).mockRejectedValue('String error');

    const request = new NextRequest('http://localhost:3000/api/cron/bill-reminders');
    const response = await GET(request);

    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toEqual({
      error: 'Internal server error',
      message: 'Unknown error',
    });
  });
});
