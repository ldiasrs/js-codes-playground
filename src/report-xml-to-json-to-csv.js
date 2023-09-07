import {readFileSync} from "fs";
import Papa from "papaparse";
import {xml2json} from "xml-js";
import {json2csv} from "json-2-csv";
import {writeFile} from "./commons.js";

const csvFile = readFileSync("/Users/leonardodias/Downloads/data-1694052759385.csv", 'utf8')
//READING CSV
const results = await Papa.parse(csvFile, {delimiter: ','});
const data = results.data
const reportXmlToJsonToCsv = []
for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const applicationNumber = row[0]
    const xml = row[1]?.replaceAll("\\", "")
    //REGEX APPLY
    const vehicleXml = xml?.match(/<VEHICLES>(.*)<\/VEHICLES>/)[0]
    console.log(vehicleXml)
    if (vehicleXml) {
        //RESPONSE STRUCTURE
        const vehicleJson = JSON.parse(xml2json(vehicleXml, {compact: true, spaces: 4}));
        reportXmlToJsonToCsv.push({
            applicationNumber,
            ...
            vehicleJson.VEHICLES.VEHICLE
        })
    }
}
//JSON to CSV
const dataCsv = (await json2csv(reportXmlToJsonToCsv))
    .replaceAll("_attributes.", "")
    .replaceAll("PREVIOUS_LIEN_HOLDER.", "")
    .replaceAll("undefined", "")
console.log(dataCsv)
writeFile('vehicle-info.csv', dataCsv)