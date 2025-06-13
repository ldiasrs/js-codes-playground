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
interface ConflictItem extends InvestItem {
    source: "bank" | "base";
}
interface MergeResult {
    matchedAtivos: InvestItem[];
    conflicts: ConflictItem[];
}
export declare function mergeInvests(baseInvests: InvestItem[], bankInvests: InvestItem[]): MergeResult;
export {};
//# sourceMappingURL=invest-conciliation.d.ts.map