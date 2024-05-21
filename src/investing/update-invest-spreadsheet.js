import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";
import config from "../../config/global-config.prod.json" assert { type: "json" };
import { debug } from "../common/commons.js";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const readInvestList = () => {
  const investFlatList = [];
  const investList = JSON.parse(
    readFileSync(config.update_invest_spread_sheet.input_data_file)
  );
  investList.data.forEach((invest) => {
    invest.notas.forEach((nota) => {
      investFlatList.push({
        ativo: invest.produto,
        taxa: `${nota.tipo}: ${nota.indexador}`,
        aplicado: nota.valorOperacao,
        valorBruto: nota.valorBruto,
        dataCompra: nota.dataOperacao,
        dataVencimento: nota.dataVencimento,
        valorLiquido: nota.valorLiquido,
      });
    });
  });
  return investFlatList;
};

const updateInvestSpreadSheet = async (data) => {
  try {
    const jwt = new JWT({
      email: config.update_invest_spread_sheet.client_email,
      key: config.update_invest_spread_sheet.private_key,
      scopes: SCOPES,
    });
    debug("Accessing document...");
    const doc = new GoogleSpreadsheet(
      config.update_invest_spread_sheet.spread_sheet_id,
      jwt
    );
    debug("Loanding document...");
    await doc.loadInfo();
    const sheetNameCurrentDateTime = new Date()
      .toISOString()
      .replace(/:/g, "-");

    debug(`Creating sheet name: ${sheetNameCurrentDateTime} ...`);
    const sheet = await doc.addSheet({
      title: sheetNameCurrentDateTime,
      headerValues: [
        "ativo",
        "taxa",
        "aplicado",
        "valorBruto",
        "dataCompra",
        "dataVencimento",
        "valorLiquido",
      ],
    });
    debug(`Adding rows...`);
    await sheet.addRows(data);
  } catch (error) {
    console.error("Error writing data to spreadsheet:", error);
  }
};

const data = readInvestList();
await updateInvestSpreadSheet(data);
debug("Data written to spreadsheet");
