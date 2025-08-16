import { describe, it, expect } from 'vitest';
import { formatCurrency, parseUserAmount, createDecimal } from '@/lib/utils/decimal';
import { Decimal } from 'decimal.js';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format numbers as INR currency by default', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(1234.56)).toBe('₹1,234.56');
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    it('should format Decimal values as INR currency', () => {
      expect(formatCurrency(new Decimal('1000'))).toBe('₹1,000.00');
      expect(formatCurrency(new Decimal('1234.56'))).toBe('₹1,234.56');
    });

    it('should handle negative amounts correctly', () => {
      expect(formatCurrency(-500)).toBe('-₹500.00');
      expect(formatCurrency(new Decimal('-1234.56'))).toBe('-₹1,234.56');
    });

    it('should accept custom currency codes', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    });

    it('should format large amounts with proper Indian number formatting', () => {
      expect(formatCurrency(100000)).toBe('₹1,00,000.00');
      expect(formatCurrency(1000000)).toBe('₹10,00,000.00');
    });
  });

  describe('parseUserAmount', () => {
    it('should parse valid currency input', () => {
      expect(parseUserAmount('1234.56')?.toString()).toBe('1234.56');
      expect(parseUserAmount('1,234.56')?.toString()).toBe('1234.56');
      expect(parseUserAmount('₹1,234.56')?.toString()).toBe('1234.56');
      expect(parseUserAmount('$1,234.56')?.toString()).toBe('1234.56');
    });

    it('should handle edge cases', () => {
      expect(parseUserAmount('0')?.toString()).toBe('0');
      expect(parseUserAmount('0.00')?.toString()).toBe('0');
      expect(parseUserAmount('.50')?.toString()).toBe('0.5'); // Decimal normalizes to 0.5
    });

    it('should return null for invalid input', () => {
      expect(parseUserAmount('abc')).toBeNull();
      expect(parseUserAmount('123.456')).toBeNull(); // More than 2 decimal places
      expect(parseUserAmount('')).toBeNull();
      expect(parseUserAmount('   ')).toBeNull(); // Only whitespace
    });

    it('should handle negative amounts', () => {
      expect(parseUserAmount('-100.50')?.toString()).toBe('-100.5'); // Decimal normalizes trailing zeros
    });
  });

  describe('createDecimal', () => {
    it('should create Decimal from numbers', () => {
      const decimal = createDecimal(123.45);
      expect(decimal.toString()).toBe('123.45');
    });

    it('should create Decimal from strings', () => {
      const decimal = createDecimal('123.45');
      expect(decimal.toString()).toBe('123.45');
    });

    it('should handle zero', () => {
      const decimal = createDecimal(0);
      expect(decimal.toString()).toBe('0');
    });
  });
});
