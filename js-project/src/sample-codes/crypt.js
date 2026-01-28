import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config()
  
const sensitiveValue = process.argv[2];
if (!sensitiveValue) {
  console.error('Sensitive value is required');
  process.exit(1);
}

if (!process.env.DECRIPT_KEY) {
  console.error('DECRIPT_KEY is required');
  process.exit(1);
}

const decrypt = CryptoJS.AES.decrypt(sensitiveValue, process.env.DECRIPT_KEY).toString(CryptoJS.enc.Utf8)
console.log(`decrypt: ${decrypt}`)