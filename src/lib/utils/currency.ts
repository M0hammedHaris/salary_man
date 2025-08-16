/**
 * Currency formatting utilities for transaction forms
 */

export function formatCurrency(value: string): string {
  // Allow negative values for expenses
  const sign = value.startsWith("-") ? "-" : "";
  const numericValue = value.replace(/[^0-9.]/g, "");

  // Ensure only one decimal point
  const parts = numericValue.split(".");
  if (parts.length > 2) {
    return sign + parts[0] + "." + parts[1];
  }

  // Limit to 2 decimal places
  if (parts[1] && parts[1].length > 2) {
    return sign + parts[0] + "." + parts[1].slice(0, 2);
  }

  return sign + numericValue;
}

export function handleAmountChange(
  value: string,
  onChange: (value: string) => void
): void {
  const formattedValue = formatCurrency(value);
  onChange(formattedValue);
}

export function displayCurrency(amount: number | string): string {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "₹0.00";
  return `₹${numericAmount.toFixed(2)}`;
}
