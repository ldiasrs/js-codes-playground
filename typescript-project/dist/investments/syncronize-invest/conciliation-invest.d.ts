import moment from "moment";
import Dinero from "dinero.js";
interface InvestItem {
    id: string;
    ativo: string;
    taxa: string;
    numeroNota: string;
    aplicado: Dinero.Dinero;
    valorBruto: Dinero.Dinero;
    dataCompra: moment.Moment;
    dataVencimento: moment.Moment;
    valorLiquido: Dinero.Dinero;
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
//# sourceMappingURL=conciliation-invest.d.ts.map