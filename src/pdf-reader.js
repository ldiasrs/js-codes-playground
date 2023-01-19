import dotenv from 'dotenv';
dotenv.config()

// import { readPdfToText, readPDFFileAsText } from "./commons.js"

// const processData = (data) => {
//     const regex = /CDB (.*) R\$/
//     const found = regex.exec(data)
//     if (found) {
//         console.log("\n ACHEI: " + found[1])
//     } else {
//         console.log("NAO ACHEI")
//     }
// } 

// const filePath = process.env.FILE_PDF
// const lines = await readPDFFileAsText(filePath)
// console.log(lines)

// readPdfToText(filePath).then(processData)
// console.log("FIM readPdfToText")

// const pdf = require('pdf-parse');

// const dataBuffer = fs.readFileSync('path/to/pdf');
// import dotenv from 'dotenv';
// dotenv.config()

import pdf from 'pdf-parse';
import { readFileSync} from 'fs';
import Papa from 'papaparse'
const dataBuffer = readFileSync(process.env.FILE_PDF);

pdf(dataBuffer).then(function(data) {
  // data.text is the extracted text from the pdf
  console.log(data.text)
  const csv = Papa.unparse(data.text);
  // You can then save the CSV to a file
  fs.writeFileSync('saida.csv', csv);
});