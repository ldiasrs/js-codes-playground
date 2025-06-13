"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBankList = void 0;
exports.parseBaseData = parseBaseData;
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const common_helpers_1 = require("../common/common-helpers");
const parseBankList = () => {
    const inputDataFile = process.argv[2];
    if (!inputDataFile) {
        throw new Error("Input data file path is required");
    }
    const investFlatList = [];
    const investList = JSON.parse((0, fs_1.readFileSync)(inputDataFile, 'utf8'));
    investList.data.forEach((invest) => {
        invest.notas.forEach((nota) => {
            investFlatList.push({
                id: (0, uuid_1.v4)(),
                ativo: invest.produto?.trim() || "",
                taxa: `${nota.tipo}: ${nota.indexador}`,
                numeroNota: nota?.numeroNota?.toString()?.trim() || "",
                aplicado: (0, common_helpers_1.normalizeCurrency)(nota.valorOperacao),
                valorBruto: (0, common_helpers_1.normalizeCurrency)(nota.valorBruto),
                dataCompra: (0, common_helpers_1.normalizeDate)(nota.dataOperacao),
                dataVencimento: (0, common_helpers_1.normalizeDate)(nota.dataVencimento),
                valorLiquido: (0, common_helpers_1.normalizeCurrency)(nota.valorLiquido),
            });
        });
    });
    return investFlatList;
};
exports.parseBankList = parseBankList;
async function parseBaseData(doc) {
    await doc.loadInfo();
    const baseSheetTab = await doc.sheetsByTitle["base"];
    const rows = await baseSheetTab.getRows();
    const current = [];
    rows.forEach((row) => {
        current.push({
            id: (0, uuid_1.v4)(),
            ativo: row.get("Ativo")?.trim() || "",
            taxa: row.get("Taxa")?.trim() || "",
            aplicado: (0, common_helpers_1.normalizeCurrency)(row.get("Aplicado")),
            valorBruto: (0, common_helpers_1.normalizeCurrency)(row.get("Atual Bruto")),
            dataCompra: (0, common_helpers_1.normalizeDate)(row.get("Data compra")?.trim()),
            dataVencimento: (0, common_helpers_1.normalizeDate)(row.get("Vencimento")?.trim()),
            numeroNota: row.get("numeroNota")?.toString()?.trim() || "",
            valorLiquido: (0, common_helpers_1.normalizeCurrency)(0),
        });
    });
    return current;
}
//# sourceMappingURL=parser-invest.js.map