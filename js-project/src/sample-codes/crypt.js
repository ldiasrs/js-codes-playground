import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config()
  
const mySensitiveValue = "U2FsdGVkX1/F1LeSoRA/B9sM2zDpV6XmAtqnSkED7WE="

// const encrypt = CryptoJS.AES.encrypt(mySensitiveValue, process.env.DECRIPT_KEY)
// console.log(`encrypt: ${encrypt}`)

const decrypt = CryptoJS.AES.decrypt(mySensitiveValue, process.env.DECRIPT_KEY).toString(CryptoJS.enc.Utf8)
console.log(`decrypt: ${decrypt}`)