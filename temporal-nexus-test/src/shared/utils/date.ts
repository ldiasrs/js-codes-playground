// Shared utility: date helpers

/**
 * Calculate the number of months between two ISO date strings (YYYY-MM-DD).
 * Returns a positive number representing elapsed months.
 */
export function monthsBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  const dayDiff = end.getDate() - start.getDate();

  let months = yearDiff * 12 + monthDiff;
  if (dayDiff < 0) {
    months -= 1;
  }

  return Math.max(months, 0);
}

/**
 * Returns today's date as YYYY-MM-DD string.
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
