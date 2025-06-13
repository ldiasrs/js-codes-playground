import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";
import config from "../../config/global-config.prod.json" assert { type: "json" };
import { debug } from "../common/commons.js";
import moment from "moment";
import { writeFile } from "../common/commons.js";
import { v4 as uuidv4 } from "uuid";
import Dinero from "dinero.js";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

// Helper function to normalize date strings to Moment objects
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Handle ISO format (YYYY-MM-DD)
  if (trimmed.includes("-")) {
    return moment(trimmed, "YYYY-MM-DD");
  }

  // Handle DD/MM/YYYY format
  if (trimmed.includes("/")) {
    return moment(trimmed, "DD/MM/YYYY");
  }

  // Try to parse as moment
  const parsed = moment(trimmed);
  return parsed.isValid() ? parsed : null;
}

// Helper function to normalize currency values to Dinero objects
function normalizeCurrency(value) {
  if (!value) return Dinero({ amount: 0, currency: "BRL" });

  if (typeof value === "number") {
    return Dinero({ amount: Math.round(value * 100), currency: "BRL" });
  }

  const str = String(value)
    .replace(/\./g, "") // Remove dots (thousands separator)
    .replace(/,/g, ".") // Replace comma with dot (decimal separator)
    .replace(/R\$/g, "") // Remove R$ symbol
    .trim();

  const amount = Number(str) || 0;
  // Convert to cents (Dinero uses smallest currency unit)
  const amountInCents = Math.round(amount * 100);

  return Dinero({ amount: amountInCents, currency: "BRL" });
}

const readBankList = () => {
  const inputDataFile = process.argv[2];

  const investFlatList = [];
  const investList = JSON.parse(readFileSync(inputDataFile));
  investList.data.forEach((invest) => {
    invest.notas.forEach((nota) => {
      investFlatList.push({
        id: uuidv4(),
        ativo: invest.produto?.trim(),
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

async function readBaseData(doc) {
  await doc.loadInfo();
  const baseSheetTab = await doc.sheetsByTitle["base"];
  const rows = await baseSheetTab.getRows();
  const current = [];
  rows.forEach((row) => {
    current.push({
      id: uuidv4(),
      ativo: row.get("Ativo")?.trim(),
      taxa: row.get("Taxa")?.trim(),
      aplicado: normalizeCurrency(row.get("Aplicado")),
      valorBruto: normalizeCurrency(row.get("Atual Bruto")),
      dataCompra: normalizeDate(row.get("Data compra")?.trim()),
      dataVencimento: normalizeDate(row.get("Vencimento")?.trim()),
      numeroNota: row.get("numeroNota")?.toString()?.trim() || "",
      valorLiquido: 0,
    });
  });
  return current;
}

async function deleteOldData(doc) {
  await doc.sheetsByTitle["ativos"]?.delete();
  await doc.sheetsByTitle["merge"]?.delete();
  await doc.sheetsByTitle["Copy of base"]?.delete();
  await doc.sheetsByTitle["conflicts"]?.delete();
  await doc.sheetsByTitle["base-updated"]?.delete();
}

async function writeSheetInvest(doc, sheetTabName, data) {
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

async function writeSheet(doc, sheetTabName, data, headerValues) {
  const sheet = await doc.addSheet({
    title: sheetTabName,
    headerValues,
  });
  await sheet.addRows(data);
}

async function duplicateBase(doc) {
  const base = doc.sheetsByTitle["base"];
  await base.copyToSpreadsheet(
    config.update_invest_spread_sheet.spread_sheet_id
  );
}

function mergeInvests(baseInvests, bankInvests) {
  const baseConflicts = [];
  const matchedAtivos = [];
  const bankInvestMap = new Map();

  bankInvests.forEach((ativo) => {
    bankInvestMap.set(ativo.id, ativo);
  });

  baseInvests.forEach((ativoBase) => {
    const matchBankAtivo = bankInvests.find((ativoBank) => {
      // Compare ativo name
      if (ativoBank.ativo !== ativoBase.ativo) {
        return false;
      }

      // Compare dates safely
      const baseDataCompra = ativoBase.dataCompra;
      const bankDataCompra = ativoBank.dataCompra;
      if (
        !!baseDataCompra &&
        !!bankDataCompra &&
        !baseDataCompra.isSame(bankDataCompra)
      ) {
        return false;
      }

      const baseDataVencimento = ativoBase.dataVencimento;
      const bankDataVencimento = ativoBank.dataVencimento;
      if (
        !!baseDataVencimento &&
        !!bankDataVencimento &&
        !baseDataVencimento.isSame(bankDataVencimento)
      ) {
        return false;
      }

      // Compare currency values safely
      const baseAplicado = ativoBase.aplicado;
      const bankAplicado = ativoBank.aplicado;

      // If both are Dinero objects, use equals method
      if (
        baseAplicado &&
        bankAplicado &&
        typeof baseAplicado.equals === "function" &&
        typeof bankAplicado.equals === "function"
      ) {
        return baseAplicado.equals(bankAplicado);
      }

      // Fallback: convert to numbers for comparison
      const baseAmount = baseAplicado
        ? typeof baseAplicado.toUnit === "function"
          ? baseAplicado.toUnit()
          : Number(baseAplicado)
        : 0;
      const bankAmount = bankAplicado
        ? typeof bankAplicado.toUnit === "function"
          ? bankAplicado.toUnit()
          : Number(bankAplicado)
        : 0;

      return baseAmount === bankAmount;
    });

    if (!matchBankAtivo) {
      debug("Invest not found on bank: ", ativoBase);
      baseConflicts.push(ativoBase);
    } else {
      matchedAtivos.push({
        ...ativoBase,
        valorBruto: matchBankAtivo.valorBruto,
        numeroNota: matchBankAtivo.numeroNota,
      });
      bankInvestMap.delete(matchBankAtivo.id);
    }
  });

  bankInvestMap.forEach((ativoBank) => {
    debug("Invest not found on base: ", ativoBank);
  });

  const finalConflicts = [];
  bankInvestMap.forEach((value) => {
    finalConflicts.push({
      source: "bank",
      id: value.id,
      ativo: value.ativo,
      taxa: value.taxa,
      numeroNota: value.numeroNota,
      aplicado: value.aplicado,
      valorBruto: value.valorBruto,
      dataCompra: value.dataCompra,
      dataVencimento: value.dataVencimento,
      valorLiquido: value.valorLiquido,
    });
  });

  baseConflicts.forEach((value) => {
    finalConflicts.push({
      source: "base",
      id: value.id,
      ativo: value.ativo,
      taxa: value.taxa,
      numeroNota: value.numeroNota,
      aplicado: value.aplicado,
      valorBruto: value.valorBruto,
      dataCompra: value.dataCompra,
      dataVencimento: value.dataVencimento,
      valorLiquido: value.valorLiquido,
    });
  });

  return {
    matchedAtivos,
    conflicts: finalConflicts,
  };
}

const updateInvestSpreadSheet = async (data) => {
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
    const data = readBankList();

    debug(`Writing ativos tab`);
    await writeSheetInvest(doc, "ativos", data);

    debug("Read base data");
    const current = await readBaseData(doc);

    debug("Merging and getting conflics");
    const mergeResponse = mergeInvests(current, data);
    const outputFile = "output/conflicts-invest-updates.json";
    await writeFile(outputFile, JSON.stringify(mergeResponse, null, 2));
    debug("Conflicts written to file: " + outputFile);

    debug(`Writing base-updated tab`);
    await writeSheetInvest(doc, "base-updated", mergeResponse.matchedAtivos);
    debug(`Writing conflicts tab`);
    const convertedConflicts = mergeResponse.conflicts.map((item) => ({
      ...item,
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
      "ativo",
      "taxa",
      "numeroNota",
      "aplicado",
      "valorBruto",
      "dataCompra",
      "dataVencimento",
      "valorLiquido",
    ]);
    //debug(`Duplicating base tab...`);
    //await duplicateBase(doc);
  } catch (error) {
    console.error("Error writing data to spreadsheet:", error);
  }
};

await updateInvestSpreadSheet();
