/**
 * South African Phone Number Formatter
 * Formats various SA phone number inputs to +27 format
 */

/**
 * Format South African phone number to +27 format
 * Handles various input formats:
 * - 082 5816642
 * - 082 581 6642
 * - 08 25816642
 * - 0825816642
 * - +27825816642
 * - 27825816642
 * 
 * @param phone - Raw phone number input
 * @returns Formatted phone number in +27 format or original if invalid
 */
export const formatSAPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // If it starts with +27, keep it as is (already formatted)
  if (cleaned.startsWith('+27')) {
    return cleaned;
  }

  // If it starts with 27, add +
  if (cleaned.startsWith('27')) {
    return `+${cleaned}`;
  }

  // If it starts with 0, replace with +27
  if (cleaned.startsWith('0')) {
    return `+27${cleaned.substring(1)}`;
  }

  // If none of the above, assume it's missing country code
  // This handles edge cases like "825816642"
  if (/^\d{9}$/.test(cleaned)) {
    return `+27${cleaned}`;
  }

  // Return original if we can't determine format
  return phone;
};

/**
 * Validate if a phone number is a valid South African number
 * SA mobile numbers: 06x, 07x, 08x (10 digits including 0)
 * SA landline: 01x, 02x, 03x, 04x, 05x
 * 
 * @param phone - Phone number to validate
 * @returns true if valid SA number
 */
export const isValidSAPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;

  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Check if it starts with +27 and has 11 digits total (+27 + 9 digits)
  if (cleaned.startsWith('+27')) {
    const withoutPrefix = cleaned.substring(3);
    return /^\d{9}$/.test(withoutPrefix);
  }

  // Check if it starts with 27 and has 11 digits total (27 + 9 digits)
  if (cleaned.startsWith('27')) {
    const withoutPrefix = cleaned.substring(2);
    return /^\d{9}$/.test(withoutPrefix);
  }

  // Check if it starts with 0 and has 10 digits total
  if (cleaned.startsWith('0')) {
    return /^0\d{9}$/.test(cleaned);
  }

  // Check if it's just 9 digits (missing leading 0)
  if (/^\d{9}$/.test(cleaned)) {
    return true;
  }

  return false;
};

/**
 * Format phone number for display (with spaces for readability)
 * Example: +27 82 581 6642
 * 
 * @param phone - Phone number in +27 format
 * @returns Formatted phone number with spaces
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return '';

  // Remove all spaces first
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check if it's in +27 format
  if (cleaned.startsWith('+27') && cleaned.length === 12) {
    // +27 82 581 6642
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
  }

  return phone;
};

