import { debug } from "../common/commons";
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

export function mergeInvests(baseInvests: InvestItem[], bankInvests: InvestItem[]): MergeResult {
  const baseConflicts: InvestItem[] = [];
  const matchedAtivos: InvestItem[] = [];
  const bankInvestMap = new Map<string, InvestItem>();

  bankInvests.forEach((ativo) => {
    bankInvestMap.set(ativo.id, ativo);
  });

  baseInvests.forEach((ativoBase) => {
    const matchBankAtivo = bankInvests.find((ativoBank) => {
      // Compare ativo name
      if (ativoBank.ativo !== ativoBase.ativo) {
        return false;
      }

      // Compare dates safely
      const baseDataCompra = ativoBase.dataCompra;
      const bankDataCompra = ativoBank.dataCompra;
      if (!baseDataCompra.isSame(bankDataCompra)) {
        return false;
      }

      const baseDataVencimento = ativoBase.dataVencimento;
      const bankDataVencimento = ativoBank.dataVencimento;
      if (!baseDataVencimento.isSame(bankDataVencimento)) {
        return false;
      }

      // Compare currency values safely
      const baseAplicado = ativoBase.aplicado;
      const bankAplicado = ativoBank.aplicado;

      // Use Dinero's equals method for comparison
      return baseAplicado.equalsTo(bankAplicado);
    });

    if (!matchBankAtivo) {
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

  const finalConflicts: ConflictItem[] = [];
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