import { readPdfToText, readPDFFileAsText } from "./commons.js"

const processData = (data) => {
    const regex = /CDB (.*) R\$/
    const found = regex.exec(data)
    if (found) {
        console.log("\n ACHEI: " + found[1])
    } else {
        console.log("NAO ACHEI")
    }
} 

const filePath = "/Users/leonardodias/Downloads/pdfs/extrato-posicao-renda-fixa.pdf"
const lines = await readPDFFileAsText(filePath)
console.log(lines)

readPdfToText(filePath).then(processData)
console.log("FIM readPdfToText")