import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";
import config from "../../config/global-config.prod.json" assert { type: "json" };
import { debug } from "../common/commons.js";
import moment from "moment";
import { writeFile } from "../common/commons.js";
import { v4 as uuidv4 } from "uuid";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const readInvestList = () => {
  const inputDataFile = process.argv[2];

  const investFlatList = [];
  const investList = JSON.parse(readFileSync(inputDataFile));
  investList.data.forEach((invest) => {
    invest.notas.forEach((nota) => {
      const dataVencimento = nota.dataVencimento.includes("-")
        ? moment(nota.dataVencimento, "YYYY-MM-DD").format("DD/MM/YYYY")
        : nota.dataVencimento;

      const dataCompra = nota.dataOperacao.includes("-")
        ? moment(nota.dataOperacao, "YYYY-MM-DD").format("DD/MM/YYYY")
        : nota.dataOperacao;
      investFlatList.push({
        id: uuidv4(),
        ativo: invest.produto,
        taxa: `${nota.tipo}: ${nota.indexador}`,
        numeroNota: nota.numeroNota,
        aplicado: nota.valorOperacao,
        valorBruto: nota.valorBruto,
        dataCompra,
        dataVencimento,
        valorLiquido: nota.valorLiquido,
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
      ativo: row.get("Ativo"),
      taxa: row.get("Taxa"),
      aplicado: row.get("Aplicado"),
      valorBruto: row.get("Atual Bruto"),
      dataCompra: row.get("Data compra"),
      dataVencimento: row.get("Vencimento"),
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
  await writeSheet(doc, sheetTabName, data, [
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
    const ativoBaseValorAplicado = ativoBase?.aplicado
      ?.replace(".", "")
      ?.replace(",", ".")
      ?.replace("R$", "")
      ?.trim();
    const matchBankAtivo = bankInvests.find(
      (ativoBank) =>
        ativoBank.ativo?.trim() === ativoBase.ativo?.trim() &&
        moment(
          ativoBase.dataCompra?.trim(),
          ["DD/M/YYYY", "DD/MM/YYYY"],
          true
        ).isSame(
          moment(
            ativoBank.dataCompra?.trim(),
            ["DD/M/YYYY", "DD/MM/YYYY"],
            true
          )
        ) &&
        moment(
          ativoBase.dataVencimento?.trim(),
          ["DD/M/YYYY", "DD/MM/YYYY"],
          true
        ).isSame(
          moment(
            ativoBank.dataVencimento?.trim(),
            ["DD/M/YYYY", "DD/MM/YYYY"],
            true
          )
        ) &&
        Number(ativoBaseValorAplicado) === ativoBank?.aplicado
    );
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
    const data = readInvestList();

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
    await writeSheet(doc, "conflicts", mergeResponse.conflicts, [
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
