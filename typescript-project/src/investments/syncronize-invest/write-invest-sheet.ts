import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";
import { debug } from "../common/commons";
import { writeFile } from "../common/commons";
import { parseBankList, parseBaseData } from "./parse-invest-data";
import { mergeInvests } from "./invest-conciliation";
import path from "path";

// Import config using absolute path
const configPath = path.join(__dirname, "../../../config/global-config.prod.json");
const config = JSON.parse(readFileSync(configPath, 'utf8'));

interface InvestItem {
  id: string;
  ativo: string;
  taxa: string;
  numeroNota: string;
  aplicado: any; // Dinero object or number
  valorBruto: any; // Dinero object or number
  dataCompra: any; // Moment object
  dataVencimento: any; // Moment object
  valorLiquido: any; // Dinero object or number
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
    aplicado: item.aplicado ? item.aplicado.toUnit() : 0,
    valorBruto: item.valorBruto ? item.valorBruto.toUnit() : 0,
    dataCompra: item.dataCompra ? item.dataCompra.format("DD/MM/YYYY") : "",
    dataVencimento: item.dataVencimento
      ? item.dataVencimento.format("DD/MM/YYYY")
      : "",
    valorLiquido: item.valorLiquido ? item.valorLiquido.toUnit() : 0,
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