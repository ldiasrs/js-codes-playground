import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config()
  
const mySensitiveValue = "This is a value sensitive"

const encrypt = CryptoJS.AES.encrypt(mySensitiveValue, process.env.DECRIPT_KEY)
console.log(`encrypt: ${encrypt}`)

const decrypt = CryptoJS.AES.decrypt(encrypt, process.env.DECRIPT_KEY).toString(CryptoJS.enc.Utf8)
console.log(`decrypt: ${decrypt}`)