"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOldData = deleteOldData;
exports.writeSheetInvest = writeSheetInvest;
exports.writeSheet = writeSheet;
exports.duplicateBase = duplicateBase;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// Import config using absolute path
const configPath = path_1.default.join(__dirname, "../../../config/global-config.prod.json");
const config = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf8'));
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
async function writeSheet(doc, sheetTabName, data, headerValues) {
    const sheet = await doc.addSheet({
        title: sheetTabName,
        headerValues,
    });
    await sheet.addRows(data);
}
async function duplicateBase(doc) {
    const base = doc.sheetsByTitle["base"];
    if (base) {
        await base.copyToSpreadsheet(config.update_invest_spread_sheet.spread_sheet_id);
    }
}
//# sourceMappingURL=write-invest-sheet.js.map