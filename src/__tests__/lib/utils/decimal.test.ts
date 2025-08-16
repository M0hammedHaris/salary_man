import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  toDecimal,
  fromDecimal,
  toDecimalRequired,
  fromDecimalRequired,
  createDecimal,
  validateFinancialAmount,
  formatCurrency,
  parseUserAmount,
  addAmounts,
  subtractAmounts,
  calculatePercentage
} from '../../../lib/utils/decimal';

describe('Decimal Utilities', () => {
  describe('Basic Conversions', () => {
    it('should convert string to Decimal', () => {
      const result = toDecimal('123.45');
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('123.45');
    });

    it('should handle null values in toDecimal', () => {
      const result = toDecimal(null);
      expect(result).toBeNull();
    });

    it('should convert Decimal to string', () => {
      const decimal = new Decimal('123.45');
      const result = fromDecimal(decimal);
      expect(result).toBe('123.45');
    });

    it('should handle null values in fromDecimal', () => {
      const result = fromDecimal(null);
      expect(result).toBeNull();
    });

    it('should convert string to Decimal (required)', () => {
      const result = toDecimalRequired('123.45');
      expect(result).toBeInstanceOf(Decimal);
      expect(result.toString()).toBe('123.45');
    });

    it('should convert Decimal to string (required)', () => {
      const decimal = new Decimal('123.45');
      const result = fromDecimalRequired(decimal);
      expect(result).toBe('123.45');
    });
  });

  describe('Financial Validation', () => {
    it('should validate acceptable financial amounts', () => {
      const validAmounts = [
        '0.00',
        '123.45',
        '9999999999.99', // 10 digits + 2 decimal = valid
        '1.50',
        '0.01'
      ];

      validAmounts.forEach(amount => {
        const decimal = createDecimal(amount);
        expect(validateFinancialAmount(decimal)).toBe(true);
      });
    });

    it('should reject invalid financial amounts', () => {
      const invalidAmounts = [
        '12345678901.00', // 11 digits - too many
        '123.456', // 3 decimal places
        '999999999999999.99' // Way too many digits
      ];

      invalidAmounts.forEach(amount => {
        const decimal = createDecimal(amount);
        expect(validateFinancialAmount(decimal)).toBe(false);
      });
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with default INR', () => {
      const decimal = createDecimal('1234.56');
      const formatted = formatCurrency(decimal);
      expect(formatted).toBe('₹1,234.56');
    });

    it('should format currency with specified currency', () => {
      const decimal = createDecimal('1234.56');
      const formatted = formatCurrency(decimal, 'EUR');
      expect(formatted).toBe('€1,234.56');
    });
  });

  describe('User Input Parsing', () => {
    it('should parse valid user input', () => {
      const validInputs = [
        { input: '123.45', expected: '123.45' },
        { input: '$123.45', expected: '123.45' },
        { input: '1,234.56', expected: '1234.56' },
        { input: '  123.45  ', expected: '123.45' },
        { input: '0', expected: '0' },
        { input: '', expected: '0' }
      ];

      validInputs.forEach(({ input, expected }) => {
        const result = parseUserAmount(input);
        expect(result?.toString()).toBe(expected);
      });
    });

    it('should reject invalid user input', () => {
      const invalidInputs = [
        'abc',
        '123.456',
        '123.45.67',
        '12345678901.00', // Too many digits
        '$123.45abc'
      ];

      invalidInputs.forEach(input => {
        const result = parseUserAmount(input);
        expect(result).toBeNull();
      });
    });

    it('should handle negative amounts', () => {
      const result = parseUserAmount('-123.45');
      expect(result?.toString()).toBe('-123.45');
    });
  });

  describe('Financial Calculations', () => {
    it('should add amounts correctly', () => {
      const amounts = [
        createDecimal('100.50'),
        createDecimal('25.75'),
        createDecimal('10.25'),
        null // Should be ignored
      ];

      const result = addAmounts(...amounts);
      expect(result.toString()).toBe('136.5');
    });

    it('should subtract amounts correctly', () => {
      const minuend = createDecimal('100.00');
      const subtrahends = [
        createDecimal('25.50'),
        createDecimal('10.25'),
        null // Should be ignored
      ];

      const result = subtractAmounts(minuend, ...subtrahends);
      expect(result.toString()).toBe('64.25');
    });

    it('should calculate percentage correctly', () => {
      const amount = createDecimal('1000.00');
      const result = calculatePercentage(amount, 15);
      expect(result.toString()).toBe('150');
    });
  });

  describe('Precision Handling', () => {
    it('should maintain precision in calculations', () => {
      const a = createDecimal('0.1');
      const b = createDecimal('0.2');
      const result = a.plus(b);
      
      // This would be 0.30000000000000004 with regular JavaScript numbers
      expect(result.toString()).toBe('0.3');
    });

    it('should handle large financial amounts', () => {
      const large = createDecimal('9999999999.99');
      const small = createDecimal('0.01');
      const result = large.plus(small);
      
      expect(result.toString()).toBe('10000000000');
    });

    it('should handle very small amounts', () => {
      const small = createDecimal('0.01');
      const verySmall = createDecimal('0.01');
      const result = small.minus(verySmall);
      
      expect(result.toString()).toBe('0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const zero = createDecimal('0');
      expect(validateFinancialAmount(zero)).toBe(true);
      expect(formatCurrency(zero)).toBe('₹0.00');
    });

    it('should handle negative values', () => {
      const negative = createDecimal('-123.45');
      expect(validateFinancialAmount(negative)).toBe(true);
      expect(formatCurrency(negative)).toBe('-₹123.45');
    });

    it('should handle empty array in addAmounts', () => {
      const result = addAmounts();
      expect(result.toString()).toBe('0');
    });

    it('should handle subtraction with empty subtrahends', () => {
      const minuend = createDecimal('100.00');
      const result = subtractAmounts(minuend);
      expect(result.toString()).toBe('100');
    });
  });
});
