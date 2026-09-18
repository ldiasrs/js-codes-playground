/** Sheets counts days from 1899-12-30. */
const EPOCH = Date.UTC(1899, 11, 30);
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Converts a date to the serial number a spreadsheet stores it as, so the cell
 * holds a real date that sorts and subtracts rather than a formatted string.
 * The date's local calendar day is preserved.
 */
export function toSerialDate(date: Date): number {
  const localMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return (localMidnight - EPOCH) / MILLISECONDS_PER_DAY;
}
