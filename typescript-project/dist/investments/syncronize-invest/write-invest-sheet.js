import config from "../../config/global-config.prod.json" assert { type: "json" };
export async function deleteOldData(doc) {
    await doc.sheetsByTitle["ativos"]?.delete();
    await doc.sheetsByTitle["merge"]?.delete();
    await doc.sheetsByTitle["Copy of base"]?.delete();
    await doc.sheetsByTitle["conflicts"]?.delete();
    await doc.sheetsByTitle["base-updated"]?.delete();
}
export async function writeSheetInvest(doc, sheetTabName, data) {
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
export async function writeSheet(doc, sheetTabName, data, headerValues) {
    const sheet = await doc.addSheet({
        title: sheetTabName,
        headerValues,
    });
    await sheet.addRows(data);
}
export async function duplicateBase(doc) {
    const base = doc.sheetsByTitle["base"];
    if (base) {
        await base.copyToSpreadsheet(config.update_invest_spread_sheet.spread_sheet_id);
    }
}
//# sourceMappingURL=write-invest-sheet.js.map