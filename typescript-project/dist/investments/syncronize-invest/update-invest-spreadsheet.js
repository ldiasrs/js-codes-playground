"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvestSpreadSheet = void 0;
const google_spreadsheet_1 = require("google-spreadsheet");
const google_auth_library_1 = require("google-auth-library");
const fs_1 = require("fs");
const parser_invest_1 = require("./parser-invest");
const conciliation_invest_1 = require("./conciliation-invest");
const write_invest_sheet_1 = require("./write-invest-sheet");
const commons_1 = require("../common/commons");
const path_1 = __importDefault(require("path"));
const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
];
// Import config using absolute path
const configPath = path_1.default.join(__dirname, "../../../config/global-config.prod.json");
const config = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf8'));
const updateInvestSpreadSheet = async () => {
    try {
        if (!process.argv[2]) {
            console.error("\nERROR: Please provide the input file with the bank data");
            console.log("Example: npm run update-invest ./data/investimentos-2024-06-17.json");
            process.exit(1);
        }
        const jwt = new google_auth_library_1.JWT({
            email: config.update_invest_spread_sheet.client_email,
            key: config.update_invest_spread_sheet.private_key,
            scopes: SCOPES,
        });
        (0, commons_1.debug)("ATENTION: Remeber to update base tab...");
        (0, commons_1.debug)("Accessing document...");
        const doc = new google_spreadsheet_1.GoogleSpreadsheet(config.update_invest_spread_sheet.spread_sheet_id, jwt);
        (0, commons_1.debug)("Loanding document...");
        await doc.loadInfo();
        const sheetNameCurrentDateTime = new Date()
            .toISOString()
            .replace(/:/g, "-");
        (0, commons_1.debug)("Removing old data");
        await (0, write_invest_sheet_1.deleteOldData)(doc);
        (0, commons_1.debug)("Reading investimentos from bank");
        const data = (0, parser_invest_1.parseBankList)();
        (0, commons_1.debug)(`Writing ativos tab`);
        await (0, write_invest_sheet_1.writeSheetInvest)(doc, "ativos", data);
        (0, commons_1.debug)("Read base data");
        const current = await (0, parser_invest_1.parseBaseData)(doc);
        (0, commons_1.debug)("Merging and getting conflics");
        const mergeResponse = (0, conciliation_invest_1.mergeInvests)(current, data);
        const outputFile = "output/conflicts-invest-updates.json";
        await (0, commons_1.writeFile)(outputFile, JSON.stringify(mergeResponse, null, 2));
        (0, commons_1.debug)("Conflicts written to file: " + outputFile);
        (0, commons_1.debug)(`Writing base-updated tab`);
        await (0, write_invest_sheet_1.writeSheetInvest)(doc, "base-updated", mergeResponse.matchedAtivos);
        (0, commons_1.debug)(`Writing conflicts tab`);
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
        await (0, write_invest_sheet_1.writeSheet)(doc, "conflicts", convertedConflicts, [
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
    }
    catch (error) {
        console.error("Error writing data to spreadsheet:", error);
    }
};
exports.updateInvestSpreadSheet = updateInvestSpreadSheet;
(0, exports.updateInvestSpreadSheet)();
//# sourceMappingURL=update-invest-spreadsheet.js.map