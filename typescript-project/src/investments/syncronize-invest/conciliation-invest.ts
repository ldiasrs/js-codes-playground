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
  cause: string;
}

interface MergeResult {
  matchedAtivos: InvestItem[];
  conflicts: ConflictItem[];
}

export function mergeInvests(baseInvests: InvestItem[], bankInvests: InvestItem[]): MergeResult {
  const baseConflicts: (InvestItem & { cause: string })[] = [];
  const matchedAtivos: InvestItem[] = [];
  const bankInvestMap = new Map<string, InvestItem>();

  bankInvests.forEach((ativo) => {
    bankInvestMap.set(ativo.id, ativo);
  });

  baseInvests.forEach((ativoBase) => {
    let matchFound = false;
    let conflictCause = "";

    // Try to find a match in bank invests
    for (const ativoBank of bankInvests) {
      // Compare ativo name
      if (ativoBank.ativo !== ativoBase.ativo) {
        continue;
      }

      // Compare dates safely
      const baseDataCompra = ativoBase.dataCompra;
      const bankDataCompra = ativoBank.dataCompra;
      if (!baseDataCompra.isSame(bankDataCompra)) {
        conflictCause = "DATE_MISSMATCH_PURCHASE";
        continue;
      }

      const baseDataVencimento = ativoBase.dataVencimento;
      const bankDataVencimento = ativoBank.dataVencimento;
      if (!baseDataVencimento.isSame(bankDataVencimento)) {
        conflictCause = "DATE_MISSMATCH_DUE";
        continue;
      }

      // Compare currency values safely
      const baseAplicado = ativoBase.aplicado;
      const bankAplicado = ativoBank.aplicado;

      // Use Dinero's equals method for comparison
      if (!baseAplicado.equalsTo(bankAplicado)) {
        conflictCause = "AMOUNT_MISSMATCH";
        continue;
      }

      // If we reach here, we found a match
      matchFound = true;
      matchedAtivos.push({
        ...ativoBase,
        valorBruto: ativoBank.valorBruto,
        numeroNota: ativoBank.numeroNota,
      });
      bankInvestMap.delete(ativoBank.id);
      break;
    }

    if (!matchFound) {
      // If no match was found, determine the cause
      const potentialMatch = bankInvests.find(ativoBank => ativoBank.ativo === ativoBase.ativo);
      
      if (!potentialMatch) {
        conflictCause = "ASSET_NOT_FOUND_IN_BANK";
      } else {
        // We already determined the cause in the loop above
        if (!conflictCause) {
          conflictCause = "MULTIPLE_CRITERIA_MISSMATCH";
        }
      }
      
      baseConflicts.push({
        ...ativoBase,
        cause: conflictCause,
      });
    }
  });

  const finalConflicts: ConflictItem[] = [];
  
  // Add bank conflicts
  bankInvestMap.forEach((value) => {
    finalConflicts.push({
      source: "bank",
      cause: "ASSET_NOT_FOUND_IN_BASE",
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

  // Add base conflicts
  baseConflicts.forEach((value) => {
    finalConflicts.push({
      source: "base",
      cause: value.cause,
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