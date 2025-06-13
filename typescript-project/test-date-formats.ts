import { normalizeDate } from './src/investments/common/common-helpers';

// Test various date formats
const testDates = [
  "2023-12-25",           // ISO format
  "25/12/2023",           // DD/MM/YYYY
  "5/12/2023",            // D/MM/YYYY
  "25/5/2023",            // DD/M/YYYY
  "5/5/2023",             // D/M/YYYY
  "25/12/23",             // DD/MM/YY
  "5/12/23",              // D/MM/YY
  "25/5/23",              // DD/M/YY
  "5/5/23",               // D/M/YY
  "12/25/2023",           // MM/DD/YYYY (US format)
  "5/25/2023",            // M/DD/YYYY
  "12/5/2023",            // MM/D/YYYY
  "5/5/2023",             // M/D/YYYY
  "25.12.2023",           // DD.MM.YYYY (European with dots)
  "5.12.2023",            // D.MM.YYYY
  "25.5.2023",            // DD.M.YYYY
  "5.5.2023",             // D.M.YYYY
  "2023-12-25T10:30:00",  // ISO with time
  "25/12/2023 10:30",     // DD/MM/YYYY with time
  "",                     // Empty string
  "invalid-date",         // Invalid date
];

console.log("Testing date format parsing:");
console.log("==================================================");

testDates.forEach((dateStr, index) => {
  const result = normalizeDate(dateStr);
  console.log(`${index + 1}. Input: "${dateStr}"`);
  console.log(`   Output: ${result.format('YYYY-MM-DD')} (${result.isValid() ? 'Valid' : 'Invalid'})`);
  console.log("");
});

console.log("Date format testing completed!"); 