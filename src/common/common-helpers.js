import moment from "moment";
import Dinero from "dinero.js";

// Helper function to normalize date strings to Moment objects
export function normalizeDate(dateStr) {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Handle ISO format (YYYY-MM-DD)
  if (trimmed.includes("-")) {
    return moment(trimmed, "YYYY-MM-DD");
  }

  // Handle DD/MM/YYYY format
  if (trimmed.includes("/")) {
    return moment(trimmed, "DD/MM/YYYY");
  }

  // Try to parse as moment
  const parsed = moment(trimmed);
  return parsed.isValid() ? parsed : null;
}

// Helper function to normalize currency values to Dinero objects
export function normalizeCurrency(value) {
  if (!value) return Dinero({ amount: 0, currency: "BRL" });

  if (typeof value === "number") {
    return Dinero({ amount: Math.round(value * 100), currency: "BRL" });
  }

  const str = String(value)
    .replace(/\./g, "") // Remove dots (thousands separator)
    .replace(/,/g, ".") // Replace comma with dot (decimal separator)
    .replace(/R\$/g, "") // Remove R$ symbol
    .trim();

  const amount = Number(str) || 0;
  // Convert to cents (Dinero uses smallest currency unit)
  const amountInCents = Math.round(amount * 100);

  return Dinero({ amount: amountInCents, currency: "BRL" });
}
