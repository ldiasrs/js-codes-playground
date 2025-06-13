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
export declare const parseBankList: () => InvestItem[];
export declare function parseBaseData(doc: any): Promise<InvestItem[]>;
export {};
//# sourceMappingURL=parse-invest-data.d.ts.map