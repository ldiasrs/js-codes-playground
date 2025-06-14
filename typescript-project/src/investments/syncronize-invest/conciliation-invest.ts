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

interface MatchResult {
  isMatch: boolean;
  cause: string;
}

/**
 * Compares two InvestItems to determine if they match
 */
function compareInvestItems(baseItem: InvestItem, bankItem: InvestItem): MatchResult {
  // Compare ativo name
  if (bankItem.ativo !== baseItem.ativo) {
    return { isMatch: false, cause: "" };
  }

  // Compare purchase dates
  if (!baseItem.dataCompra.isSame(bankItem.dataCompra)) {
    return { isMatch: false, cause: "DATE_MISSMATCH_PURCHASE" };
  }

  // Compare due dates
  if (!baseItem.dataVencimento.isSame(bankItem.dataVencimento)) {
    return { isMatch: false, cause: "DATE_MISSMATCH_DUE" };
  }

  // Compare applied amounts
  if (!baseItem.aplicado.equalsTo(bankItem.aplicado)) {
    return { isMatch: false, cause: "AMOUNT_MISSMATCH" };
  }

  return { isMatch: true, cause: "" };
}

/**
 * Creates a merged InvestItem from base and bank items
 */
function createMergedItem(baseItem: InvestItem, bankItem: InvestItem): InvestItem {
  return {
    ...baseItem,
    valorBruto: bankItem.valorBruto,
    numeroNota: bankItem.numeroNota,
  };
}

/**
 * Determines the conflict cause when no match is found
 */
function determineConflictCause(baseItem: InvestItem, bankInvests: InvestItem[], existingCause: string): string {
  if (existingCause) {
    return existingCause;
  }

  const potentialMatch = bankInvests.find(bankItem => bankItem.ativo === baseItem.ativo);
  
  if (!potentialMatch) {
    return "ASSET_NOT_FOUND_IN_BANK";
  }
  
  return "MULTIPLE_CRITERIA_MISSMATCH";
}

/**
 * Processes base investments to find matches and conflicts
 */
function processBaseInvestments(
  baseInvests: InvestItem[], 
  bankInvests: InvestItem[]
): { matchedAtivos: InvestItem[], baseConflicts: (InvestItem & { cause: string })[], remainingBankMap: Map<string, InvestItem> } {
  const baseConflicts: (InvestItem & { cause: string })[] = [];
  const matchedAtivos: InvestItem[] = [];
  const bankInvestMap = new Map<string, InvestItem>();

  // Create a map of bank investments for efficient lookup
  bankInvests.forEach((ativo) => {
    bankInvestMap.set(ativo.id, ativo);
  });

  baseInvests.forEach((ativoBase) => {
    let matchFound = false;
    let conflictCause = "";

    // Try to find a match in bank invests
    for (const ativoBank of bankInvests) {
      const matchResult = compareInvestItems(ativoBase, ativoBank);
      
      if (matchResult.isMatch) {
        matchFound = true;
        matchedAtivos.push(createMergedItem(ativoBase, ativoBank));
        bankInvestMap.delete(ativoBank.id);
        break;
      } else {
        conflictCause = matchResult.cause;
      }
    }

    if (!matchFound) {
      const finalCause = determineConflictCause(ativoBase, bankInvests, conflictCause);
      baseConflicts.push({
        ...ativoBase,
        cause: finalCause,
      });
    }
  });

  return { matchedAtivos, baseConflicts, remainingBankMap: bankInvestMap };
}

/**
 * Converts remaining bank investments to conflicts
 */
function createBankConflicts(bankInvestMap: Map<string, InvestItem>): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  
  bankInvestMap.forEach((value) => {
    conflicts.push({
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

  return conflicts;
}

/**
 * Converts base conflicts to the final conflict format
 */
function createBaseConflicts(baseConflicts: (InvestItem & { cause: string })[]): ConflictItem[] {
  return baseConflicts.map((value) => ({
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
  }));
}

/**
 * Merges base and bank investments, identifying matches and conflicts
 */
export function mergeInvests(baseInvests: InvestItem[], bankInvests: InvestItem[]): MergeResult {
  // Process base investments to find matches and conflicts
  const { matchedAtivos, baseConflicts, remainingBankMap } = processBaseInvestments(baseInvests, bankInvests);

  // Create final conflicts list
  const bankConflicts = createBankConflicts(remainingBankMap);
  const finalBaseConflicts = createBaseConflicts(baseConflicts);
  const finalConflicts = [...bankConflicts, ...finalBaseConflicts];

  return {
    matchedAtivos,
    conflicts: finalConflicts,
  };
} 