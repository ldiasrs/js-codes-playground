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
  source: "bank" | "base";
}

interface ConflictItem extends InvestItem {
  cause: string;
  validationLvl: "ERROR" | "WARN";
}

interface MergeResult {
  matchedAtivos: InvestItem[];
  conflicts: ConflictItem[];
}

interface MatchResult {
  isMatch: boolean;
  cause: string;
  mergedItem?: InvestItem;
  validationLvl?: "ERROR" | "WARN";
}

interface ConfigOptions {
  dateThresholdDays: number;
  amountThreshold: number;
  enableFuzzyAtivoMatch: boolean;
  compareDate?: moment.Moment;
}

type ProcessBaseInvestmentsResult = {
  matchedAtivos: InvestItem[];
  baseConflicts: (InvestItem & { cause: string; validationLvl: "ERROR" | "WARN" })[];
  remainingBankMap: Map<string, InvestItem>;
};

const DEFAULT_CONFIG: ConfigOptions = {
  dateThresholdDays: 2,
  amountThreshold: 50,
  enableFuzzyAtivoMatch: true,
  compareDate: moment(),
};

/**
 * Compares two InvestItems to determine if they match
 */
function compareInvestItems(baseItem: InvestItem, bankItem: InvestItem, config: ConfigOptions): MatchResult {
  // Compare ativo name (allow prefix match if enabled)
  const baseAtivo = baseItem.ativo.trim().toUpperCase();
  const bankAtivo = bankItem.ativo.trim().toUpperCase();
  let ativoMatch = false;
  let ativoWarn = false;
  if (baseAtivo === bankAtivo) {
    ativoMatch = true;
  } else if (config.enableFuzzyAtivoMatch && (baseAtivo.startsWith(bankAtivo) || bankAtivo.startsWith(baseAtivo))) {
    ativoMatch = true;
    ativoWarn = true;
  }
  if (!ativoMatch) {
    return { isMatch: false, cause: "ASSET_NAME_MISSMATCH", validationLvl: "ERROR" };
  }

  // Compare purchase dates (allow configurable days difference)
  const baseCompra = baseItem.dataCompra;
  const bankCompra = bankItem.dataCompra;
  const compraDiff = Math.abs(baseCompra.diff(bankCompra, 'days'));
  let compraDate = baseCompra;
  let compraWarn = false;
  if (compraDiff <= config.dateThresholdDays) {
    compraDate = bankCompra;
    if (compraDiff > 0) {
      compraWarn = true;
    }
  } else if (!baseCompra.isSame(bankCompra)) {
    return { isMatch: false, cause: "DATE_MISSMATCH_PURCHASE", validationLvl: "ERROR" };
  }

  // Compare due dates (allow configurable days difference)
  const baseVenc = baseItem.dataVencimento;
  const bankVenc = bankItem.dataVencimento;
  const vencDiff = Math.abs(baseVenc.diff(bankVenc, 'days'));
  let vencDate = baseVenc;
  let vencWarn = false;
  if (vencDiff <= config.dateThresholdDays) {
    vencDate = bankVenc;
    if (vencDiff > 0) {
      vencWarn = true;
    }
  } else if (!baseVenc.isSame(bankVenc)) {
    return { isMatch: false, cause: "DATE_MISSMATCH_DUE", validationLvl: "ERROR" };
  }

  // Compare applied amounts (allow configurable difference)
  const baseAplicado = baseItem.aplicado;
  const bankAplicado = bankItem.aplicado;
  const amountDiff = Math.abs(baseAplicado.getAmount() - bankAplicado.getAmount());
  let aplicado = baseAplicado;
  let amountWarn = false;
  if (amountDiff <= config.amountThreshold) {
    aplicado = bankAplicado;
    if (amountDiff > 0) {
      amountWarn = true;
    }
  } else if (!baseAplicado.equalsTo(bankAplicado)) {
    return { isMatch: false, cause: "AMOUNT_MISSMATCH", validationLvl: "ERROR" };
  }

  // Determine validation level
  const validationLvl = (ativoWarn || compraWarn || vencWarn || amountWarn) ? "WARN" : "ERROR";

  // If we reach here, we found a match (with possible corrections)
  const mergedItem: InvestItem = {
    ...baseItem,
    ativo: bankItem.ativo, // always prefer bank's ativo if matched
    dataCompra: compraDate,
    dataVencimento: vencDate,
    aplicado: aplicado,
    valorBruto: bankItem.valorBruto,
    numeroNota: bankItem.numeroNota,
    valorLiquido: bankItem.valorLiquido,
    source: "base", // merged items keep base source
  };
  return { isMatch: true, cause: "", mergedItem, validationLvl };
}

/**
 * Creates a merged InvestItem from base and bank items
 */
function createMergedItem(baseItem: InvestItem, bankItem: InvestItem, mergedItem?: InvestItem): InvestItem {
  if (mergedItem) return mergedItem;
  return {
    ...baseItem,
    valorBruto: bankItem.valorBruto,
    numeroNota: bankItem.numeroNota,
  };
}

/**
 * Determines the conflict cause when no match is found
 */
function determineConflictCause(baseItem: InvestItem, bankInvests: InvestItem[], existingCause: string, config: ConfigOptions): string {
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
 * Checks if an investment is overdue based on compareDate
 */
function checkOverdueStatus(item: InvestItem, config: ConfigOptions): string {
  if (!config.compareDate) {
    return "";
  }
  
  if (item.dataVencimento.isBefore(config.compareDate)) {
    return "OVERDUE_INVEST";
  }
  
  return "";
}

/**
 * Processes base investments to find matches and conflicts
 */
function processBaseInvestments(
  baseInvests: InvestItem[], 
  bankInvests: InvestItem[],
  config: ConfigOptions
): ProcessBaseInvestmentsResult {
  const baseConflicts: (InvestItem & { cause: string; validationLvl: "ERROR" | "WARN" })[] = [];
  const matchedAtivos: InvestItem[] = [];
  const bankInvestMap = new Map<string, InvestItem>();

  bankInvests.forEach((ativo) => {
    bankInvestMap.set(ativo.id, ativo);
  });

  baseInvests.forEach((ativoBase) => {
    let matchFound = false;
    let conflictCause = "";
    let validationLvl: "ERROR" | "WARN" = "ERROR";
    let matchedBankItem: InvestItem | null = null;

    for (const ativoBank of bankInvests) {
      const matchResult = compareInvestItems(ativoBase, ativoBank, config);
      if (matchResult.isMatch) {
        matchFound = true;
        matchedBankItem = ativoBank;
        matchedAtivos.push(createMergedItem(ativoBase, ativoBank, matchResult.mergedItem));
        
        // Add to conflicts with WARN level if there were threshold issues
        if (matchResult.validationLvl === "WARN") {
          baseConflicts.push({
            ...ativoBase,
            cause: "THRESHOLD_MATCH",
            validationLvl: "WARN",
          });
          
          // Also add the corresponding bank item with WARN level
          baseConflicts.push({
            ...ativoBank,
            cause: "THRESHOLD_MATCH",
            validationLvl: "WARN",
          });
        }
        
        bankInvestMap.delete(ativoBank.id);
        break;
      } else {
        conflictCause = matchResult.cause;
        validationLvl = matchResult.validationLvl || "ERROR";
      }
    }

    if (!matchFound) {
      const finalCause = determineConflictCause(ativoBase, bankInvests, conflictCause, config);
      baseConflicts.push({
        ...ativoBase,
        cause: finalCause,
        validationLvl: validationLvl,
      });
    }
  });

  return { matchedAtivos, baseConflicts, remainingBankMap: bankInvestMap };
}

/**
 * Converts remaining bank investments to conflicts
 */
function createBankConflicts(bankInvestMap: Map<string, InvestItem>, config: ConfigOptions): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  
  bankInvestMap.forEach((value) => {
    const overdueCause = checkOverdueStatus(value, config);
    const cause = overdueCause || "ASSET_NOT_FOUND_IN_BASE";
    
    conflicts.push({
      ...value,
      cause: cause,
      validationLvl: "ERROR",
    });
  });

  return conflicts;
}

/**
 * Converts base conflicts to the final conflict format
 */
function createBaseConflicts(baseConflicts: (InvestItem & { cause: string; validationLvl: "ERROR" | "WARN" })[], config: ConfigOptions): ConflictItem[] {
  return baseConflicts.map((value) => {
    const overdueCause = checkOverdueStatus(value, config);
    const cause = overdueCause || value.cause;
    
    return {
      ...value,
      cause: cause,
      validationLvl: value.validationLvl,
    };
  });
}

/**
 * Merges base and bank investments, identifying matches and conflicts
 */
export function mergeInvests(
  baseInvests: InvestItem[], 
  bankInvests: InvestItem[], 
  configOptions?: Partial<ConfigOptions>
): MergeResult {
  // Use provided config or default values
  const config: ConfigOptions = {
    ...DEFAULT_CONFIG,
    ...configOptions,
  };

  // Process base investments to find matches and conflicts
  const { matchedAtivos, baseConflicts, remainingBankMap } = processBaseInvestments(baseInvests, bankInvests, config);

  // Create final conflicts list
  const bankConflicts = createBankConflicts(remainingBankMap, config);
  const finalBaseConflicts = createBaseConflicts(baseConflicts, config);
  const finalConflicts = [...bankConflicts, ...finalBaseConflicts];

  return {
    matchedAtivos,
    conflicts: finalConflicts,
  };
} 