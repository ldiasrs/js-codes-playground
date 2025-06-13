"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDate = exports.normalizeCurrency = void 0;
const moment_1 = __importDefault(require("moment"));
const dinero_js_1 = __importDefault(require("dinero.js"));
// Currency normalization using Dinero.js with support for multiple formats
const normalizeCurrency = (value) => {
    if (value === undefined || value === null) {
        return (0, dinero_js_1.default)({ amount: 0, currency: 'BRL' });
    }
    if (typeof value === "number") {
        return (0, dinero_js_1.default)({ amount: Math.round(value * 100), currency: 'BRL' });
    }
    // Handle string values with currency symbols and formatting
    const str = String(value)
        .replace(/\./g, "") // Remove dots (thousands separator)
        .replace(/,/g, ".") // Replace comma with dot (decimal separator)
        .replace(/R\$/g, "") // Remove R$ symbol
        .replace(/\s/g, "") // Remove spaces
        .trim();
    const numValue = parseFloat(str);
    if (isNaN(numValue)) {
        return (0, dinero_js_1.default)({ amount: 0, currency: 'BRL' });
    }
    // Convert to cents (Dinero uses smallest currency unit)
    const amountInCents = Math.round(numValue * 100);
    return (0, dinero_js_1.default)({ amount: amountInCents, currency: 'BRL' });
};
exports.normalizeCurrency = normalizeCurrency;
// Date normalization using moment.js with support for multiple formats
const normalizeDate = (dateString) => {
    if (!dateString) {
        return (0, moment_1.default)(); // Return current date as default
    }
    const trimmed = dateString.trim();
    // Handle ISO format (YYYY-MM-DD)
    if (trimmed.includes("-")) {
        const parsed = (0, moment_1.default)(trimmed, "YYYY-MM-DD");
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
            const parsed = (0, moment_1.default)(trimmed, format);
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
            const parsed = (0, moment_1.default)(trimmed, format);
            if (parsed.isValid()) {
                return parsed;
            }
        }
    }
    // Try to parse as moment with default parsing
    const parsed = (0, moment_1.default)(trimmed);
    if (parsed.isValid()) {
        return parsed;
    }
    // Return current date as fallback for invalid dates
    return (0, moment_1.default)();
};
exports.normalizeDate = normalizeDate;
//# sourceMappingURL=common-helpers.js.map