import Papa from 'papaparse'
import { readFileSync} from 'fs';

//CSV--------------------------------------------------------
//[ '66105', 'Non-Unique', 'Kansas City', 'Wyandotte' ]
// 67002,Non-Unique,Andover,Butler
// 67010,Non-Unique,Augusta,Butler
// 67012,PO Box,Beaumont,Butler

//STRUCTURE--------------------------------------------------
// const option = {
//     "label": "Tarrant County, Texas",
//     "zipcodes": [
//       "76244",
//       "76248"
//     ],
//     "value": "TARRANT",
//     "membershipGroup": {
//       "id": "0995",
//       "description": "Tarrant County"
//     }
//   }

const csvFile = readFileSync("ZIPcodes.csv", 'utf8')
var results = Papa.parse(csvFile, { delimiter: ','});
let regionsZipCodes = new Map()
const jsonStructures = []
results.data.slice(1).map((row) => {
    const zipCodeName = row[2]
    const country = row[3]
    const regionKey = `${zipCodeName}-${country}`
    const regionStructure = {
        label: `${zipCodeName}, ${country}`,
        zipcodes: [],
        value: zipCodeName?.toUpperCase().replace('COUNTY', ''),
        membershipGroup: {
            id: '0000',
            description: zipCodeName
        }
    }
    const zipCodesRegion = regionsZipCodes.get(regionKey) ?? regionStructure
    zipCodesRegion.zipcodes.push(row[0])
    regionsZipCodes.set(regionKey, zipCodesRegion) 
})
for (let [key, value] of regionsZipCodes) {
    console.log(value);
    //console.log(JSON.stringify(value, null, 2)+",");
}