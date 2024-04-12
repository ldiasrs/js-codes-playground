import {GoogleSpreadsheet} from 'google-spreadsheet';
import {JWT} from 'google-auth-library'

import creds from '../../config/google-service-account-credential.json' assert {type: "json"};
import investList from '../../data/investimentos-2024-03-22.json' assert {type: "json"};

function readInvestList() {
    const investFlatList = [];
    investList.data.forEach((invest) => {
        invest.notas.forEach((nota) => {
            investFlatList.push({
                ativo: invest.produto,
                taxa: `${nota.tipo}: ${nota.indexador}`,
                aplicado: nota.valorOperacao,
                valorBruto: nota.valorBruto,
                dataCompra: nota.dataOperacao,
                dataVencimento: nota.dataVencimento,
                valorLiquido: nota.valorLiquido
            });
        });
    });
    return investFlatList
}

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];

function log(...args) {
    console.log('-', ...args);
}

async function writeToSpreadsheet(data) {
    try {
        const jwt = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: SCOPES,
        });
        log('Accessing document...');
        const doc = new GoogleSpreadsheet('1j3fpSKtSihxPpZLaXzq73lTCl47U2jeZHQUpKGHCddA', jwt);
        log('Loanding document...');
        await doc.loadInfo();
        const sheetNameCurrentDateTime = new Date().toISOString().replace(/:/g, '-');
        log(`Creating sheet name: ${sheetNameCurrentDateTime} ...`);
        const sheet = await doc.addSheet(
            {title:sheetNameCurrentDateTime, 
                headerValues: ['ativo', 'taxa', 'aplicado', 'valorBruto', 'dataCompra', 'dataVencimento', 'valorLiquido']
            });
        log(`Adding rows...`);
        await sheet.addRows(data);
    } catch (error) {
        console.error('Error writing data to spreadsheet:', error);
    }
}


const data = readInvestList();
await writeToSpreadsheet(data);
log('Data written to spreadsheet');