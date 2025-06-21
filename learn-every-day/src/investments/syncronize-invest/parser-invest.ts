import { readFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { normalizeCurrency, normalizeDate } from "../common/common-helpers";
import moment from "moment";
import Dinero from "dinero.js";

interface InvestItem {
  id: string;
  source: "bank" | "base";
  ativo: string;
  taxa: string;
  numeroNota: string;
  aplicado: Dinero.Dinero;
  valorBruto: Dinero.Dinero;
  dataCompra: moment.Moment;
  dataVencimento: moment.Moment;
  valorLiquido: Dinero.Dinero;
}

interface BankInvestData {
  data: Array<{
    produto: string;
    notas: Array<{
      tipo: string;
      indexador: string;
      numeroNota?: string;
      valorOperacao: number;
      valorBruto: number;
      dataOperacao: string;
      dataVencimento: string;
      valorLiquido: number;
    }>;
  }>;
}

export const parseBankList = (): InvestItem[] => {
  const inputDataFile = process.argv[2];
  
  if (!inputDataFile) {
    throw new Error("Input data file path is required");
  }

  const investFlatList: InvestItem[] = [];
  const investList: BankInvestData = JSON.parse(readFileSync(inputDataFile, 'utf8'));
  investList.data.forEach((invest) => {
    invest.notas.forEach((nota) => {
      investFlatList.push({
        id: uuidv4(),
        source: "bank",
        ativo: invest.produto?.trim() || "",
        taxa: `${nota.tipo}: ${nota.indexador}`,
        numeroNota: nota?.numeroNota?.toString()?.trim() || "",
        aplicado: normalizeCurrency(nota.valorOperacao),
        valorBruto: normalizeCurrency(nota.valorBruto),
        dataCompra: normalizeDate(nota.dataOperacao),
        dataVencimento: normalizeDate(nota.dataVencimento),
        valorLiquido: normalizeCurrency(nota.valorLiquido),
      });
    });
  });
  return investFlatList;
};

export async function parseBaseData(doc: any): Promise<InvestItem[]> {
  await doc.loadInfo();
  const baseSheetTab = await doc.sheetsByTitle["base"];
  const rows = await baseSheetTab.getRows();
  const current: InvestItem[] = [];
  rows.forEach((row: any) => {
    current.push({
      id: uuidv4(),
      source: "base",
      ativo: row.get("Ativo")?.trim() || "",
      taxa: row.get("Taxa")?.trim() || "",
      aplicado: normalizeCurrency(row.get("Aplicado")),
      valorBruto: normalizeCurrency(row.get("Atual Bruto")),
      dataCompra: normalizeDate(row.get("Data compra")?.trim()),
      dataVencimento: normalizeDate(row.get("Vencimento")?.trim()),
      numeroNota: row.get("numeroNota")?.toString()?.trim() || "",
      valorLiquido: normalizeCurrency(0),
    });
  });
  return current;
} 