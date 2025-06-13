import { GoogleSpreadsheet } from "google-spreadsheet";
interface InvestItem {
    id: string;
    ativo: string;
    taxa: string;
    numeroNota: string;
    aplicado: any;
    valorBruto: any;
    dataCompra: any;
    dataVencimento: any;
    valorLiquido: any;
}
export declare function deleteOldData(doc: GoogleSpreadsheet): Promise<void>;
export declare function writeSheetInvest(doc: GoogleSpreadsheet, sheetTabName: string, data: InvestItem[]): Promise<void>;
export declare function writeSheet(doc: GoogleSpreadsheet, sheetTabName: string, data: any[], headerValues: string[]): Promise<void>;
export declare function duplicateBase(doc: GoogleSpreadsheet): Promise<void>;
export {};
//# sourceMappingURL=write-invest-sheet.d.ts.map