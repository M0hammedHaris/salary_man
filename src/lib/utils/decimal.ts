import { Decimal } from 'decimal.js';

/**
 * Utility functions for handling decimal precision in financial operations
 * This ensures consistent handling of monetary values throughout the application
 */

/**
 * Convert string from database to Decimal
 */
export function toDecimal(value: string | null): Decimal | null {
  if (value === null || value === undefined) return null;
  return new Decimal(value);
}

/**
 * Convert Decimal to string for database storage
 */
export function fromDecimal(value: Decimal | null): string | null {
  if (value === null || value === undefined) return null;
  return value.toString();
}

/**
 * Convert string to Decimal (required field)
 */
export function toDecimalRequired(value: string): Decimal {
  return new Decimal(value);
}

/**
 * Convert Decimal to string (required field)
 */
export function fromDecimalRequired(value: Decimal): string {
  return value.toString();
}

/**
 * Create a new Decimal from number with proper precision
 */
export function createDecimal(value: number | string): Decimal {
  return new Decimal(value);
}

/**
 * Validate decimal precision for financial amounts (max 12 digits, 2 decimal places)
 */
export function validateFinancialAmount(value: Decimal): boolean {
  const str = value.toString();
  const parts = str.split('.');
  const integerPart = parts[0].replace('-', ''); // Remove negative sign for counting
  
  // Max 10 integer digits + 2 decimal places = 12 total precision
  if (integerPart.length > 10) return false;
  if (parts[1] && parts[1].length > 2) return false;
  
  return true;
}

/**
 * Format Decimal or number for display (with currency symbol)
 */
export function formatCurrency(value: Decimal | number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const numericValue = typeof value === 'number' ? value : value.toNumber();
  return formatter.format(numericValue);
}

/**
 * Parse user input to Decimal with validation
 */
export function parseUserAmount(input: string): Decimal | null {
  try {
    // Remove currency symbols and whitespace
    const cleaned = input.replace(/[$,\s]/g, '');
    
    // Validate format
    if (!/^-?\d*\.?\d{0,2}$/.test(cleaned)) {
      return null;
    }
    
    const decimal = new Decimal(cleaned || '0');
    
    // Validate financial constraints
    if (!validateFinancialAmount(decimal)) {
      return null;
    }
    
    return decimal;
  } catch {
    return null;
  }
}

/**
 * Safe addition of decimal amounts
 */
export function addAmounts(...amounts: (Decimal | null)[]): Decimal {
  return amounts
    .filter((amount): amount is Decimal => amount !== null)
    .reduce((sum, amount) => sum.plus(amount), new Decimal(0));
}

/**
 * Safe subtraction of decimal amounts
 */
export function subtractAmounts(minuend: Decimal, ...subtrahends: (Decimal | null)[]): Decimal {
  return subtrahends
    .filter((amount): amount is Decimal => amount !== null)
    .reduce((result, amount) => result.minus(amount), minuend);
}

/**
 * Calculate percentage of an amount
 */
export function calculatePercentage(amount: Decimal, percentage: number): Decimal {
  return amount.mul(percentage).div(100);
}
