/**
 * Format a number as South African currency with commas
 * @param value - The numeric value or string to format
 * @returns Formatted currency string (e.g., "R 100,000.00")
 */
export const formatCurrency = (value: number | string): string => {
  if (!value && value !== 0) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(numValue)) return '';
  
  return `R ${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Format input value as currency while typing
 * @param value - The input string
 * @returns Formatted string with commas
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-digit and non-decimal characters
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Format the integer part with commas
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  return parts.join('.');
};

/**
 * Remove formatting from currency string to get raw number
 * @param value - Formatted currency string
 * @returns Raw number string
 */
export const unformatCurrency = (value: string): string => {
  return value.replace(/[^\d.]/g, '');
};

/**
 * Parse formatted currency string to number
 * @param value - Formatted currency string
 * @returns Numeric value
 */
export const parseCurrency = (value: string): number => {
  const cleaned = unformatCurrency(value);
  return parseFloat(cleaned) || 0;
};

