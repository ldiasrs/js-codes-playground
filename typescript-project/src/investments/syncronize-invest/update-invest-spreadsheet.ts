import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";
import { parseBankList, parseBaseData } from "./parser-invest";
import { mergeInvests } from "./conciliation-invest";
import {
  writeSheetInvest,
  writeSheet,
  deleteOldData,
} from "./write-invest-sheet";
import { debug, writeFile } from "../common/commons";
import path from "path";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

// Import config using absolute path
const configPath = path.join(__dirname, "../../../config/global-config.prod.json");
const config = JSON.parse(readFileSync(configPath, 'utf8'));

export const updateInvestSpreadSheet = async (): Promise<void> => {
  try {
    if (!process.argv[2]) {
      console.error(
        "\nERROR: Please provide the input file with the bank data"
      );
      console.log(
        "Example: npm run update-invest ./data/investimentos-2024-06-17.json"
      );
      process.exit(1);
    }
    const jwt = new JWT({
      email: config.update_invest_spread_sheet.client_email,
      key: config.update_invest_spread_sheet.private_key,
      scopes: SCOPES,
    });
    debug("ATENTION: Remeber to update base tab...");
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

    debug("Removing old data");
    await deleteOldData(doc);

    debug("Reading investimentos from bank");
    const bankInvests = parseBankList();

    debug(`Writing ativos tab`);
    await writeSheetInvest(doc, "ativos", bankInvests);

    debug("Read base data");
    const baseInvests = await parseBaseData(doc);

    debug("Merging and getting conflics");
    const mergeResponse = mergeInvests(baseInvests, bankInvests);
    const outputFile = "output/conflicts-invest-updates.json";
    await writeFile(outputFile, JSON.stringify(mergeResponse, null, 2));
    debug("Conflicts written to file: " + outputFile);

    debug(`Writing base-updated tab`);
    await writeSheetInvest(doc, "base-updated", mergeResponse.matchedAtivos);
    debug(`Writing conflicts tab`);
    const convertedConflicts = mergeResponse.conflicts.map((item) => ({
      ...item,
      causes: item.causes.map((cause) => `${cause.validatorKey}: ${cause.validatorResultCode}`).join(", "),
      aplicado: item.aplicado ? item.aplicado.toUnit() : 0,
      valorBruto: item.valorBruto ? item.valorBruto.toUnit() : 0,
      dataCompra: item.dataCompra ? item.dataCompra.format("DD/MM/YYYY") : "",
      dataVencimento: item.dataVencimento
        ? item.dataVencimento.format("DD/MM/YYYY")
        : "",
      valorLiquido: item.valorLiquido ? item.valorLiquido.toUnit() : 0,
    }));

    await writeSheet(doc, "conflicts", convertedConflicts, [
      "source",
      "causes",
      "ativo",
      "taxa",
      "numeroNota",
      "aplicado",
      "valorBruto",
      "dataCompra",
      "dataVencimento",
      "valorLiquido",
    ]);
  } catch (error) {
    console.error("Error writing data to spreadsheet:", error);
  }
};

 updateInvestSpreadSheet(); 