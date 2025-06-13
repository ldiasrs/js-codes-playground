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
export declare const parseBankList: () => InvestItem[];
export declare function parseBaseData(doc: any): Promise<InvestItem[]>;
export {};
//# sourceMappingURL=parser-invest.d.ts.map