import moment from 'moment';
import Dinero from 'dinero.js';

// Currency normalization using Dinero.js with support for multiple formats
export const normalizeCurrency = (value: number | string | undefined): Dinero.Dinero => {
  if (value === undefined || value === null) {
    return Dinero({ amount: 0, currency: 'BRL' });
  }

  if (typeof value === "number") {
    return Dinero({ amount: Math.round(value * 100), currency: 'BRL' });
  }

  // Handle string values with currency symbols and formatting
  let str = String(value)
    .replace(/R\$/g, "") // Remove R$ symbol
    .replace(/\s/g, "") // Remove spaces
    .trim();

  // Determine if it's European format (comma as decimal separator) or US format (dot as decimal separator)
  const hasComma = str.includes(",");
  const hasDot = str.includes(".");
  
  if (hasComma && hasDot) {
    // Both comma and dot present - determine format by position
    const commaIndex = str.lastIndexOf(",");
    const dotIndex = str.lastIndexOf(".");
    
    if (commaIndex > dotIndex) {
      // European format: 1.000,50 -> 1000.50
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: 1,000.50 -> 1000.50
      str = str.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // Only comma - could be European decimal or thousands separator
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount === 1 && str.split(",")[1].length <= 2) {
      // Likely decimal separator: 1000,50 -> 1000.50
      str = str.replace(",", ".");
    } else {
      // Likely thousands separator: 1,000 -> 1000
      str = str.replace(/,/g, "");
    }
  } else if (!hasComma && hasDot) {
    // Only dot - could be US decimal or thousands separator
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount === 1 && str.split(".")[1].length <= 2) {
      // Likely decimal separator: 1000.50 -> 1000.50 (keep as is)
    } else {
      // Likely thousands separator: 1.000 -> 1000
      str = str.replace(/\./g, "");
    }
  }

  const numValue = parseFloat(str);
  
  if (isNaN(numValue)) {
    return Dinero({ amount: 0, currency: 'BRL' });
  }
  
  // Convert to cents (Dinero uses smallest currency unit)
  const amountInCents = Math.round(numValue * 100);
  
  return Dinero({ amount: amountInCents, currency: 'BRL' });
};

// Date normalization using moment.js with support for multiple formats
export const normalizeDate = (dateString: string | undefined): moment.Moment => {
  if (!dateString) {
    return moment(); // Return current date as default
  }

  const trimmed = dateString.trim();

  // Handle ISO format (YYYY-MM-DD)
  if (trimmed.includes("-")) {
    const parsed = moment(trimmed, "YYYY-MM-DD");
    if (parsed.isValid()) {
      return parsed;
    }
  }

  // Handle DD/MM/YYYY format
  if (trimmed.includes("/")) {
    // Try different slash-separated formats
    const formats = [
      "DD/MM/YYYY",
      "D/MM/YYYY", 
      "DD/M/YYYY",
      "D/M/YYYY",
      "DD/MM/YY",
      "D/MM/YY",
      "DD/M/YY",
      "D/M/YY",
      "MM/DD/YYYY",
      "M/DD/YYYY",
      "MM/D/YYYY",
      "M/D/YYYY",
      "MM/DD/YY",
      "M/DD/YY",
      "MM/D/YY",
      "M/D/YY"
    ];

    for (const format of formats) {
      const parsed = moment(trimmed, format);
      if (parsed.isValid()) {
        return parsed;
      }
    }
  }

  // Handle DD.MM.YYYY format (European format with dots)
  if (trimmed.includes(".")) {
    const formats = [
      "DD.MM.YYYY",
      "D.MM.YYYY",
      "DD.M.YYYY",
      "D.M.YYYY",
      "DD.MM.YY",
      "D.MM.YY",
      "DD.M.YY",
      "D.M.YY"
    ];

    for (const format of formats) {
      const parsed = moment(trimmed, format);
      if (parsed.isValid()) {
        return parsed;
      }
    }
  }

  // Try to parse as moment with default parsing
  const parsed = moment(trimmed);
  if (parsed.isValid()) {
    return parsed;
  }

  // Return current date as fallback for invalid dates
  return moment();
}; 