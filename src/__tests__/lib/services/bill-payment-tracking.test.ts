import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BillService } from '../../../lib/services/bill-service';
import { BillNotificationService } from '../../../lib/services/bill-notification-service';
import { db } from '../../../lib/db';

// Mock the database and notification service
vi.mock('../../../lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../lib/services/bill-notification-service', () => ({
  BillNotificationService: {
    getBillNotificationPreferences: vi.fn(),
    sendPaymentConfirmationNotification: vi.fn(),
  },
}));

describe('BillService - Payment Confirmation and Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(BillNotificationService.getBillNotificationPreferences).mockResolvedValue({
      email: true,
      push: false,
      inApp: true,
      sms: false,
    });
    
    vi.mocked(BillNotificationService.sendPaymentConfirmationNotification).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockBillWithAccount = {
    bill: {
      id: 'bill-1',
      userId: 'user-1',
      accountId: 'account-1',
      name: 'Credit Card Payment',
      amount: '1500.00',
      frequency: 'monthly' as const,
      nextDueDate: new Date('2025-08-30T00:00:00Z'),
      categoryId: 'category-1',
      isActive: true,
      status: 'pending' as const,
      reminderDays: '1,3,7',
      lastProcessed: null,
      paymentDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    account: {
      id: 'account-1',
      userId: 'user-1',
      name: 'Chase Credit Card',
      type: 'credit_card' as const,
      balance: '-800.00',
      creditLimit: '5000.00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  };

  const mockUpdatedBill = {
    ...mockBillWithAccount.bill,
    status: 'paid' as const,
    paymentDate: new Date('2025-08-27T10:00:00Z'),
    lastProcessed: new Date('2025-08-27T10:00:00Z'),
    nextDueDate: new Date('2025-09-30T00:00:00Z'),
  };

  describe('markBillAsPaid', () => {
    it('should mark bill as paid and send confirmation notification', async () => {
      // Mock database calls
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBillWithAccount])
            })
          })
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedBill])
          })
        })
      });

      vi.mocked(db.select).mockImplementation(mockSelect as any);
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await BillService.markBillAsPaid(
        'bill-1',
        'user-1',
        new Date('2025-08-27T10:00:00Z')
      );

      expect(result).toEqual(mockUpdatedBill);
      
      // Should have called notification service
      expect(BillNotificationService.getBillNotificationPreferences).toHaveBeenCalledWith('user-1', 'bill-1');
      expect(BillNotificationService.sendPaymentConfirmationNotification).toHaveBeenCalledWith(
        'user-1',
        mockUpdatedBill,
        mockBillWithAccount.account,
        '1500.00',
        { email: true, push: false, inApp: true, sms: false }
      );
    });

    it('should mark bill as paid without sending notification when disabled', async () => {
      // Mock database calls
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBillWithAccount])
            })
          })
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedBill])
          })
        })
      });

      vi.mocked(db.select).mockImplementation(mockSelect as any);
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await BillService.markBillAsPaid(
        'bill-1',
        'user-1',
        new Date('2025-08-27T10:00:00Z'),
        false // Disable notifications
      );

      expect(result).toEqual(mockUpdatedBill);
      
      // Should NOT have called notification service
      expect(BillNotificationService.getBillNotificationPreferences).not.toHaveBeenCalled();
      expect(BillNotificationService.sendPaymentConfirmationNotification).not.toHaveBeenCalled();
    });

    it('should handle notification failures gracefully', async () => {
      // Mock database calls
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBillWithAccount])
            })
          })
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedBill])
          })
        })
      });

      vi.mocked(db.select).mockImplementation(mockSelect as any);
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      // Make notification service fail
      vi.mocked(BillNotificationService.sendPaymentConfirmationNotification)
        .mockRejectedValueOnce(new Error('Notification failed'));

      // Should still complete successfully
      const result = await BillService.markBillAsPaid('bill-1', 'user-1');

      expect(result).toEqual(mockUpdatedBill);
    });

    it('should return null when bill not found', async () => {
      // Mock empty result
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
      });

      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await BillService.markBillAsPaid('nonexistent', 'user-1');

      expect(result).toBeNull();
      expect(BillNotificationService.sendPaymentConfirmationNotification).not.toHaveBeenCalled();
    });
  });

  describe('detectBillPayments', () => {
    it('should detect and match transactions to bills', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        userId: 'user-1',
        accountId: 'account-1',
        amount: '-1500.00', // Negative for payment
        description: 'Payment',
        categoryId: 'category-1',
        transactionDate: new Date('2025-08-27T10:00:00Z'),
        isRecurring: false,
        recurringPaymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock pending bills query
      const mockSelectBills = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockBillWithAccount.bill])
        })
      });

      // Mock transactions query  
      const mockSelectTransactions = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockTransaction])
        })
      });

      // Mock update call for linking transaction
      const mockUpdateTransaction = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 })
        })
      });

      // Setup sequential mocks for different tables
      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectBills() as any;
        if (callCount === 2) return mockSelectTransactions() as any;
        return mockSelectBills() as any; // fallback
      });

      vi.mocked(db.update).mockImplementation(mockUpdateTransaction as any);

      // Mock the markBillAsPaid call within detectBillPayments
      const markBillAsPaidSpy = vi.spyOn(BillService, 'markBillAsPaid')
        .mockResolvedValue(mockUpdatedBill);

      const result = await BillService.detectBillPayments('user-1', 3);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUpdatedBill);
      expect(markBillAsPaidSpy).toHaveBeenCalledWith(
        'bill-1',
        'user-1',
        mockTransaction.transactionDate,
        true
      );

      markBillAsPaidSpy.mockRestore();
    });

    it('should not match transactions with wrong amount', async () => {
      const mockTransactionWrongAmount = {
        id: 'transaction-1',
        userId: 'user-1',
        accountId: 'account-1',
        amount: '-1000.00', // Different amount
        description: 'Payment',
        categoryId: 'category-1',
        transactionDate: new Date('2025-08-27T10:00:00Z'),
        isRecurring: false,
        recurringPaymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock queries
      const mockSelectBills = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockBillWithAccount.bill])
        })
      });

      const mockSelectTransactions = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockTransactionWrongAmount])
        })
      });

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectBills() as any;
        return mockSelectTransactions() as any;
      });

      const markBillAsPaidSpy = vi.spyOn(BillService, 'markBillAsPaid');

      const result = await BillService.detectBillPayments('user-1', 3);

      expect(result).toHaveLength(0);
      expect(markBillAsPaidSpy).not.toHaveBeenCalled();

      markBillAsPaidSpy.mockRestore();
    });
  });

  describe('getBillPaymentHistory', () => {
    it('should return payment history with linked transactions', async () => {
      const mockPaidBill = {
        ...mockBillWithAccount.bill,
        status: 'paid' as const,
        paymentDate: new Date('2025-08-27T10:00:00Z'),
      };

      const mockLinkedTransaction = {
        id: 'transaction-1',
        userId: 'user-1',
        accountId: 'account-1',
        amount: '-1500.00',
        recurringPaymentId: 'bill-1',
        transactionDate: new Date('2025-08-27T10:00:00Z'),
      };

      // Mock paid bills query
      const mockSelectPaidBills = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPaidBill])
            })
          })
        })
      });

      // Mock linked transaction query
      const mockSelectTransaction = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockLinkedTransaction])
          })
        })
      });

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectPaidBills() as any;
        return mockSelectTransaction() as any;
      });

      const result = await BillService.getBillPaymentHistory('bill-1', 'user-1', 12);

      expect(result).toHaveLength(1);
      expect(result[0].bill).toEqual(mockPaidBill);
      expect(result[0].transaction).toEqual(mockLinkedTransaction);
    });
  });

  describe('createPaymentTransaction', () => {
    it('should create a payment transaction linked to bill', async () => {
      const mockCreatedTransaction = {
        id: 'transaction-1',
        userId: 'user-1',
        accountId: 'account-1',
        amount: '-1500.00',
        description: 'Payment for Credit Card Payment',
        categoryId: 'category-1',
        transactionDate: expect.any(Date),
        isRecurring: true,
        recurringPaymentId: 'bill-1',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedTransaction])
        })
      });

      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await BillService.createPaymentTransaction(
        'bill-1',
        'user-1',
        '1500.00',
        'account-1',
        'category-1',
        'Payment for Credit Card Payment'
      );

      expect(result).toEqual(mockCreatedTransaction);
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
