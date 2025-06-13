import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";
import { debug } from "../common/commons";
import { writeFile } from "../common/commons";
import { parseBankList, parseBaseData } from "./parser-invest";
import { mergeInvests } from "./conciliation-invest";
import path from "path";
import moment from "moment";
import Dinero from "dinero.js";

// Import config using absolute path
const configPath = path.join(__dirname, "../../../config/global-config.prod.json");
const config = JSON.parse(readFileSync(configPath, 'utf8'));

interface InvestItem {
  id: string;
  ativo: string;
  taxa: string;
  numeroNota: string;
  aplicado: Dinero.Dinero;
  valorBruto: Dinero.Dinero;
  dataCompra: moment.Moment;
  dataVencimento: moment.Moment;
  valorLiquido: Dinero.Dinero;
}

export async function deleteOldData(doc: GoogleSpreadsheet): Promise<void> {
  await doc.sheetsByTitle["ativos"]?.delete();
  await doc.sheetsByTitle["merge"]?.delete();
  await doc.sheetsByTitle["Copy of base"]?.delete();
  await doc.sheetsByTitle["conflicts"]?.delete();
  await doc.sheetsByTitle["base-updated"]?.delete();
}

export async function writeSheetInvest(doc: GoogleSpreadsheet, sheetTabName: string, data: InvestItem[]): Promise<void> {
  // Convert data for spreadsheet writing
  const convertedData = data.map((item) => ({
    ...item,
    aplicado: item.aplicado.toUnit(),
    valorBruto: item.valorBruto.toUnit(),
    dataCompra: item.dataCompra.format("DD/MM/YYYY"),
    dataVencimento: item.dataVencimento.format("DD/MM/YYYY"),
    valorLiquido: item.valorLiquido.toUnit(),
  }));

  await writeSheet(doc, sheetTabName, convertedData, [
    "ativo",
    "taxa",
    "numeroNota",
    "aplicado",
    "valorBruto",
    "dataCompra",
    "dataVencimento",
    "valorLiquido",
  ]);
}

export async function writeSheet(doc: GoogleSpreadsheet, sheetTabName: string, data: any[], headerValues: string[]): Promise<void> {
  const sheet = await doc.addSheet({
    title: sheetTabName,
    headerValues,
  });
  await sheet.addRows(data);
}

export async function duplicateBase(doc: GoogleSpreadsheet): Promise<void> {
  const base = doc.sheetsByTitle["base"];
  if (base) {
    await base.copyToSpreadsheet(
      config.update_invest_spread_sheet.spread_sheet_id
    );
  }
} 