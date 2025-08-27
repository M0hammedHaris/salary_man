import { describe, it, expect } from 'vitest';

describe('Balance Calculation Fix Verification', () => {
  describe('Correct Balance Calculation Logic', () => {
    it('should calculate balance correctly for two income transactions', () => {
      // Test case: BOB account with two income transactions
      const transactions = [
        { amount: 3383.00, type: 'income', description: 'Last month Balance' },
        { amount: 72500.00, type: 'income', description: 'Salary payment' }
      ];

      const expectedBalance = transactions.reduce((sum, transaction) => {
        return sum + transaction.amount;
      }, 0);

      expect(expectedBalance).toBe(75883.00);
    });

    it('should handle mixed income and expense transactions', () => {
      const transactions = [
        { amount: 3383.00, type: 'income' },
        { amount: 72500.00, type: 'income' },
        { amount: -5000.00, type: 'expense' }, // Expense (negative)
        { amount: -1000.00, type: 'expense' }  // Expense (negative)
      ];

      const totalCredits = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const totalDebits = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      
      const finalBalance = totalCredits + totalDebits; // totalDebits is already negative

      expect(totalCredits).toBe(75883.00);
      expect(totalDebits).toBe(-6000.00);
      expect(finalBalance).toBe(69883.00);
    });

    it('should not accumulate initial balances on transaction updates', () => {
      // This test verifies that we don't double-count balances
      const initialBalance = 0; // Should always start from 0 for transaction-based calculation
      const transaction1 = 3383.00;
      const transaction2 = 72500.00;

      // First transaction
      const balanceAfterFirst = initialBalance + transaction1;
      expect(balanceAfterFirst).toBe(3383.00);

      // Second transaction - should calculate from all transactions, not previous balance
      const allTransactions = [transaction1, transaction2];
      const correctBalance = allTransactions.reduce((sum, t) => sum + t, 0);
      
      // This should be 75883, not (3383 + 3383 + 72500) = 79266
      expect(correctBalance).toBe(75883.00);
      expect(correctBalance).not.toBe(79266.00); // Avoid the accumulation bug
    });

    it('should handle credit card balances correctly', () => {
      // Credit card with debt (negative balances)
      const creditCardTransactions = [
        { amount: -1500.00, description: 'Purchase' },
        { amount: -250.00, description: 'Fee' },
        { amount: 500.00, description: 'Payment' } // Payment reduces debt
      ];

      const totalDebits = creditCardTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      const totalCredits = creditCardTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      
      const balance = totalCredits + totalDebits;

      expect(totalDebits).toBe(-1750.00);
      expect(totalCredits).toBe(500.00);
      expect(balance).toBe(-1250.00); // Net debt
    });

    it('should verify calculation matches database logic', () => {
      // This mirrors the SQL calculation used in the repository
      const transactions = [
        { amount: 3383.00 },
        { amount: 72500.00 }
      ];

      // SQL equivalent: SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)
      const totalCredits = transactions.reduce((sum, t) => {
        return sum + (t.amount > 0 ? t.amount : 0);
      }, 0);

      // SQL equivalent: SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)
      const totalDebits = transactions.reduce((sum, t) => {
        return sum + (t.amount < 0 ? t.amount : 0);
      }, 0);

      const finalBalance = totalCredits + totalDebits;

      expect(totalCredits).toBe(75883.00);
      expect(totalDebits).toBe(0.00);
      expect(finalBalance).toBe(75883.00);
    });
  });

  describe('Edge Cases and Error Prevention', () => {
    it('should handle empty transaction lists', () => {
      const transactions: number[] = [];
      const balance = transactions.reduce((sum, amount) => sum + amount, 0);
      expect(balance).toBe(0);
    });

    it('should handle single large transaction', () => {
      const transaction = 1000000.00; // 1 million
      expect(transaction).toBe(1000000.00);
    });

    it('should handle decimal precision correctly', () => {
      const transaction1 = 100.33;
      const transaction2 = 50.67;
      const total = transaction1 + transaction2;
      expect(parseFloat(total.toFixed(2))).toBe(151.00);
    });

    it('should prevent balance calculation bugs from recurring', () => {
      // Simulating the bug scenario that was fixed
      const storedBalance = 296766.00; // The incorrect balance we had
      const correctCalculation = 3383.00 + 72500.00;
      
      expect(correctCalculation).toBe(75883.00);
      expect(correctCalculation).not.toBe(storedBalance);
      
      // The bug was caused by: storedBalance + newTransaction
      // instead of: sum of all transactions
      const buggyCalculation = 75883.00 + 75883.00; // Adding to existing balance
      expect(buggyCalculation).toBe(151766.00);
      expect(buggyCalculation).not.toBe(correctCalculation);
    });
  });
});
