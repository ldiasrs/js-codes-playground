import { readFileSync,readFile, writeFile as _writeFile } from 'fs';
import format from 'xml-formatter';
import { PdfReader } from "pdfreader";

export function readFile2(fileName) {
    return readFileSync(fileName, 'utf8');
}
export function formatXml (xml) {
    return format(xml);
}

export function printoutput(output) {
    console.log("\n"+output);
}

export function writeFile(filePath, content) {
    _writeFile(filePath, content, err => {
    if (err) {
        console.error(err);
    }
    });
}

export  async function readPDFFileAsText(filePath) {
    const pdftext = []
     await new PdfReader().parseFileItems(filePath, function(err, item){
        if (item && item.text) {
            //console.log(item.text)
            pdftext.push(item.text)
        }
      });
      console.log("FIM readPDFFileAsText")
      return pdftext
}

export function readPdfToText(filePath) {
    let str = '';
    if (filePath) {
        return new Promise((resolve, reject) => {
            readFile(filePath, (err, pdfBuffer) => {
                new PdfReader().parseBuffer(pdfBuffer, async (err, item) => {
                    if (err) {
                        reject(err);
                    }
                    if (Boolean(item) && item.text !== undefined) {
                        str = str + ' ' + item.text;
                    } else if (!item) {
                        resolve(str)
                    }
                });
            });
        })
    }
}
