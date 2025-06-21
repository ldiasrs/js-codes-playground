import { normalizeCurrency } from '../investments/common/common-helpers';

// Test various currency formats
const testCurrencies = [
  1000,                    // Number
  "1000",                  // String number
  "1.000",                 // With thousands separator (dot)
  "1,000",                 // With thousands separator (comma)
  "1.000,50",              // European format
  "1,000.50",              // US format
  "R$ 1.000,50",           // With R$ symbol
  "R$1.000,50",            // With R$ symbol no space
  "R$ 1,000.50",           // US format with R$ symbol
  "1 000,50",              // With space as thousands separator
  "1000.50",               // Decimal with dot
  "1000,50",               // Decimal with comma
  "R$ 1000",               // Simple with R$ symbol
  "R$ 1000.50",            // Decimal with R$ symbol
  "",                      // Empty string
  "invalid",               // Invalid currency
  undefined,               // Undefined
  null,                    // Null
];

console.log("Testing currency format parsing:");
console.log("==================================================");

testCurrencies.forEach((currency, index) => {
  const result = normalizeCurrency(currency);
  console.log(`${index + 1}. Input: "${currency}"`);
  console.log(`   Output: ${result.toUnit()} (${result.getCurrency()})`);
  console.log("");
});

console.log("Currency format testing completed!"); 