import { debug } from "../common/commons";
import { 
  Validator, 
  ValidationResult, 
  ValidatorResult, 
  ValidatorProcessor, 
  ValidationsProcessor 
} from "../../common/validator";
import { AtivoNameValidator, PurchaseDateValidator, DueDateValidator, AmountValidator, InvestmentValidator } from "./validation-invest";
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
  causes: Cause[];
}

interface Cause {
  validatorKey: string;
  validatorResultCode: ValidationResultCode;
}

interface MergeResult {
  matchedAtivos: InvestItem[];
  conflicts: ConflictItem[];
}

interface ConfigOptions {
  dateThresholdDays: number;
  amountThreshold: number;
  enableFuzzyAtivoMatch: boolean;
  compareDate?: moment.Moment;
}

type ProcessBaseInvestmentsResult = {
  matchedAtivos: InvestItem[];
  baseConflicts: (InvestItem & { causes: Cause[] })[];
  remainingBankMap: Map<string, InvestItem>;
};

const DEFAULT_CONFIG: ConfigOptions = {
  dateThresholdDays: 2,
  amountThreshold: 50,
  enableFuzzyAtivoMatch: true,
  compareDate: moment(),
};

/**
 * Validation result codes
 */
export enum ValidationResultCode {
  MATCHED = "MATCHED",
  PARTIAL_MATCH = "PARTIAL_MATCH",
  UNMATCHED = "UNMATCHED",
  EMPTY = "--"
}

/**
 * Validator keys
 */
export enum ValidatorKey {
  ATIVO_NAME = "ATIVO_NAME",
  PURCHASE_DATE = "PURCHASE_DATE",
  DUE_DATE = "DUE_DATE",
  AMOUNT = "AMOUNT",
  OVERDUE_DATE = "OVERDUE_DATE",
  FOUND_REFERENCE = "FOUND_REFERENCE"
}

/**
 * Context for investment comparison
 */
export interface InvestmentComparisonContext {
  baseItem: InvestItem;
  bankItem: InvestItem;
  config: ConfigOptions;
}

/**
 * Service for creating merged items
 */
class MergedItemService {
  static createMergedItem(baseItem: InvestItem, bankItem: InvestItem): InvestItem {
    return {
      ...baseItem,
      ativo: bankItem.ativo,
      dataCompra: bankItem.dataCompra,
      dataVencimento: bankItem.dataVencimento,
      aplicado: bankItem.aplicado,
      valorBruto: bankItem.valorBruto,
      numeroNota: bankItem.numeroNota,
      valorLiquido: bankItem.valorLiquido,
      source: "base",
    };
  }
}

/**
 * Investment processing orchestrator
 */
class InvestmentProcessor {
  private validator: InvestmentValidator;

  constructor() {
    this.validator = new InvestmentValidator();
  }

  /**
   * Processes all base investments against bank investments
   */
  processInvestments(
    baseInvests: InvestItem[], 
    bankInvests: InvestItem[], 
    config: ConfigOptions
  ): ValidatorResult<InvestItem, ConflictItem> {
    const bankInvestMap = this.createBankInvestMap(bankInvests);
    const { matchedItems, conflictItems } = this.processBaseInvestments(baseInvests, bankInvests, bankInvestMap, config);
    
    // Add remaining bank investments as conflicts
    const remainingConflicts = this.processRemainingBankInvestments(bankInvestMap, config);
    conflictItems.push(...remainingConflicts);

    return { matchedItems, conflictItems };
  }

  /**
   * Creates a map of bank investments for efficient lookup
   */
  private createBankInvestMap(bankInvests: InvestItem[]): Map<string, InvestItem> {
    const bankInvestMap = new Map<string, InvestItem>();
    bankInvests.forEach(item => {
      bankInvestMap.set(item.id, item);
    });
    return bankInvestMap;
  }

  /**
   * Processes base investments against bank investments
   */
  private processBaseInvestments(
    baseInvests: InvestItem[],
    bankInvests: InvestItem[],
    bankInvestMap: Map<string, InvestItem>,
    config: ConfigOptions
  ): { matchedItems: InvestItem[]; conflictItems: ConflictItem[] } {
    const matchedItems: InvestItem[] = [];
    const conflictItems: ConflictItem[] = [];

    baseInvests.forEach(baseItem => {
      const matchResult = this.findBestMatch(baseItem, bankInvests, config);
      
      if (matchResult.isMatched) {
        this.handleMatchedInvestment(baseItem, matchResult, matchedItems, conflictItems, bankInvestMap);
      } else {
        this.handleUnmatchedInvestment(baseItem, matchResult, conflictItems, config);
      }
    });

    return { matchedItems, conflictItems };
  }

  /**
   * Finds the best matching bank investment for a base investment
   */
  private findBestMatch(
    baseItem: InvestItem,
    bankInvests: InvestItem[],
    config: ConfigOptions
  ): {
    isMatched: boolean;
    bankItem?: InvestItem;
    results?: ValidationResult<ValidatorKey, ValidationResultCode>[];
  } {
    for (const bankItem of bankInvests) {
      const context: InvestmentComparisonContext = { baseItem, bankItem, config };
      const { isValid, results } = this.validator.validateComparison(context);
      
      if (isValid) {
        return { isMatched: true, bankItem, results };
      }
    }
    
    return { isMatched: false };
  }

  /**
   * Handles a matched investment by creating merged item and managing conflicts
   */
  private handleMatchedInvestment(
    baseItem: InvestItem,
    matchResult: { isMatched: boolean; bankItem?: InvestItem; results?: ValidationResult<ValidatorKey, ValidationResultCode>[] },
    matchedItems: InvestItem[],
    conflictItems: ConflictItem[],
    bankInvestMap: Map<string, InvestItem>
  ): void {
    if (!matchResult.bankItem || !matchResult.results) return;

    // Create merged item
    const mergedItem = MergedItemService.createMergedItem(baseItem, matchResult.bankItem);
    matchedItems.push(mergedItem);
    bankInvestMap.delete(matchResult.bankItem.id);

    // Handle partial matches as conflicts
    this.handlePartialMatches(baseItem, matchResult.bankItem, matchResult.results, conflictItems);
  }

  /**
   * Handles partial matches by adding them to conflicts
   */
  private handlePartialMatches(
    baseItem: InvestItem,
    bankItem: InvestItem,
    results: ValidationResult<ValidatorKey, ValidationResultCode>[],
    conflictItems: ConflictItem[]
  ): void {
    const partialResults = results.filter(result => result.resultCode === ValidationResultCode.PARTIAL_MATCH);
    
    if (partialResults.length > 0) {
      const causes: Cause[] = partialResults.map(result => ({
        validatorKey: result.validatorKey,
        validatorResultCode: result.resultCode
      }));

      // Add both base and bank items to conflicts
      conflictItems.push({
        ...baseItem,
        causes
      });
      
      conflictItems.push({
        ...bankItem,
        causes
      });
    }
  }

  /**
   * Handles an unmatched investment by creating appropriate conflicts
   */
  private handleUnmatchedInvestment(
    baseItem: InvestItem,
    matchResult: { isMatched: boolean; bankItem?: InvestItem; results?: ValidationResult<ValidatorKey, ValidationResultCode>[] },
    conflictItems: ConflictItem[],
    config: ConfigOptions
  ): void {
    const causes: Cause[] = this.createCausesForUnmatchedInvestment(baseItem, matchResult, config);
    
    conflictItems.push({
      ...baseItem,
      causes
    });
  }

  /**
   * Creates causes for an unmatched investment
   */
  private createCausesForUnmatchedInvestment(
    baseItem: InvestItem,
    matchResult: { isMatched: boolean; bankItem?: InvestItem; results?: ValidationResult<ValidatorKey, ValidationResultCode>[] },
    config: ConfigOptions
  ): Cause[] {
    const causes: Cause[] = [];
    
    // Use results from the last attempted comparison or create default causes
    if (matchResult.results) {
      causes.push(...matchResult.results
        .filter(result => result.resultCode === ValidationResultCode.UNMATCHED)
        .map(result => ({
          validatorKey: result.validatorKey,
          validatorResultCode: result.resultCode
        }))
      );
    } else {
      // Create default causes for no match found
      if (config.compareDate && baseItem.dataVencimento.isBefore(config.compareDate)) {
        causes.push({
          validatorKey: ValidatorKey.OVERDUE_DATE,
          validatorResultCode: ValidationResultCode.EMPTY
        });
      }
      causes.push({
        validatorKey: ValidatorKey.FOUND_REFERENCE,
        validatorResultCode: ValidationResultCode.EMPTY
      });
    }

    return causes;
  }

  /**
   * Processes remaining bank investments as conflicts
   */
  private processRemainingBankInvestments(
    bankInvestMap: Map<string, InvestItem>,
    config: ConfigOptions
  ): ConflictItem[] {
    const conflicts: ConflictItem[] = [];

    bankInvestMap.forEach(bankItem => {
      const causes: Cause[] = this.createCausesForRemainingBankInvestment(bankItem, config);
      
      conflicts.push({
        ...bankItem,
        causes
      });
    });

    return conflicts;
  }

  /**
   * Creates causes for a remaining bank investment
   */
  private createCausesForRemainingBankInvestment(bankItem: InvestItem, config: ConfigOptions): Cause[] {
    const causes: Cause[] = [
      { validatorKey: ValidatorKey.ATIVO_NAME, validatorResultCode: ValidationResultCode.UNMATCHED }
    ];

    // Check if the bank item is overdue
    if (config.compareDate && bankItem.dataVencimento.isBefore(config.compareDate)) {
      causes.push({ validatorKey: ValidatorKey.OVERDUE_DATE, validatorResultCode: ValidationResultCode.UNMATCHED });
    }

    return causes;
  }
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

  const processor = new InvestmentProcessor();
  const result = processor.processInvestments(baseInvests, bankInvests, config);

  return {
    matchedAtivos: result.matchedItems,
    conflicts: result.conflictItems,
  };
} 