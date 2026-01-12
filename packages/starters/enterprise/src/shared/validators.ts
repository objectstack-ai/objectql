/**
 * Shared validation utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic check)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
}

/**
 * Validate currency amount (positive number with max 2 decimals)
 */
export function isValidCurrency(amount: number): boolean {
  return amount >= 0 && Number.isFinite(amount);
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(value: number): boolean {
  return value >= 0 && value <= 100 && Number.isFinite(value);
}

/**
 * Validate date is not in the future
 */
export function isNotFutureDate(date: Date): boolean {
  return date <= new Date();
}

/**
 * Validate date range (start before end)
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate;
}
