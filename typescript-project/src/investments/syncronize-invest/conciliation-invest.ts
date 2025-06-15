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
enum ValidationResultCode {
  MATCHED = "MATCHED",
  PARTIAL_MATCH = "PARTIAL_MATCH",
  UNMATCHED = "UNMATCHED",
  EMPTY = "--"
}

/**
 * Validator keys
 */
enum ValidatorKey {
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
interface InvestmentComparisonContext {
  baseItem: InvestItem;
  bankItem: InvestItem;
  config: ConfigOptions;
}

/**
 * Individual validation result
 */
interface ValidationResult {
  validatorKey: ValidatorKey;
  resultCode: ValidationResultCode;
}

/**
 * Comprehensive validation result for a comparison
 */
interface ValidatorResult {
  matchedItems: InvestItem[];
  conflictItems: ConflictItem[];
}

/**
 * Abstract base class for validators
 */
abstract class Validator {
  abstract readonly key: ValidatorKey;
  abstract validate(context: InvestmentComparisonContext): ValidationResult;
}

/**
 * Validator for ativo name
 */
class AtivoNameValidator extends Validator {
  readonly key = ValidatorKey.ATIVO_NAME;

  validate(context: InvestmentComparisonContext): ValidationResult {
    const { baseItem, bankItem, config } = context;
    const baseAtivo = baseItem.ativo.trim().toUpperCase();
    const bankAtivo = bankItem.ativo.trim().toUpperCase();
    
    if (baseAtivo === bankAtivo) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.MATCHED
      };
    }
    
    if (config.enableFuzzyAtivoMatch && (baseAtivo.startsWith(bankAtivo) || bankAtivo.startsWith(baseAtivo))) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.PARTIAL_MATCH
      };
    }
    
    return {
      validatorKey: this.key,
      resultCode: ValidationResultCode.UNMATCHED
    };
  }
}

/**
 * Validator for purchase date
 */
class PurchaseDateValidator extends Validator {
  readonly key = ValidatorKey.PURCHASE_DATE;

  validate(context: InvestmentComparisonContext): ValidationResult {
    const { baseItem, bankItem, config } = context;
    const baseCompra = baseItem.dataCompra;
    const bankCompra = bankItem.dataCompra;
    const compraDiff = Math.abs(baseCompra.diff(bankCompra, 'days'));
    
    if (compraDiff === 0) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.MATCHED
      };
    }
    
    if (compraDiff <= config.dateThresholdDays) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.PARTIAL_MATCH
      };
    }
    
    return {
      validatorKey: this.key,
      resultCode: ValidationResultCode.UNMATCHED
    };
  }
}

/**
 * Validator for due date
 */
class DueDateValidator extends Validator {
  readonly key = ValidatorKey.DUE_DATE;

  validate(context: InvestmentComparisonContext): ValidationResult {
    const { baseItem, bankItem, config } = context;
    const baseVenc = baseItem.dataVencimento;
    const bankVenc = bankItem.dataVencimento;
    const vencDiff = Math.abs(baseVenc.diff(bankVenc, 'days'));
    
    if (vencDiff === 0) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.MATCHED
      };
    }
    
    if (vencDiff <= config.dateThresholdDays) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.PARTIAL_MATCH
      };
    }
    
    return {
      validatorKey: this.key,
      resultCode: ValidationResultCode.UNMATCHED
    };
  }
}

/**
 * Validator for amount
 */
class AmountValidator extends Validator {
  readonly key = ValidatorKey.AMOUNT;

  validate(context: InvestmentComparisonContext): ValidationResult {
    const { baseItem, bankItem, config } = context;
    const baseAplicado = baseItem.aplicado;
    const bankAplicado = bankItem.aplicado;
    const amountDiff = Math.abs(baseAplicado.getAmount() - bankAplicado.getAmount());
    
    if (amountDiff === 0) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.MATCHED
      };
    }
    
    if (amountDiff <= config.amountThreshold) {
      return {
        validatorKey: this.key,
        resultCode: ValidationResultCode.PARTIAL_MATCH
      };
    }
    
    return {
      validatorKey: this.key,
      resultCode: ValidationResultCode.UNMATCHED
    };
  }
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
 * Main validation orchestrator
 */
class InvestmentValidator {
  private validators: Validator[] = [
    new AtivoNameValidator(),
    new PurchaseDateValidator(),
    new DueDateValidator(),
    new AmountValidator(),
  ];

  /**
   * Validates a single comparison between base and bank items
   */
  validateComparison(context: InvestmentComparisonContext): {
    isValid: boolean;
    results: ValidationResult[];
  } {
    const results = this.validators.map(validator => validator.validate(context));
    // Check if all validators passed (either MATCHED or PARTIAL_MATCH)
    const isValid = results.every(result => 
      result.resultCode === ValidationResultCode.MATCHED || 
      result.resultCode === ValidationResultCode.PARTIAL_MATCH
    );
    return { isValid, results };
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
  ): ValidatorResult {
    const matchedItems: InvestItem[] = [];
    const conflictItems: ConflictItem[] = [];
    const bankInvestMap = new Map<string, InvestItem>();
   

    // Create map of bank investments
    bankInvests.forEach(item => {
      bankInvestMap.set(item.id, item);
    });

    // Process each base investment
    baseInvests.forEach(baseItem => {
      let matchFound = false;
      let bestMatch: { bankItem: InvestItem; results: ValidationResult[] } | null = null;
      // Try to find a match with each bank investment
      for (const bankItem of bankInvests) {
        const context: InvestmentComparisonContext = { baseItem, bankItem, config };
        const { isValid, results } = this.validator.validateComparison(context);  
        if (isValid) {
          matchFound = true;
          bestMatch = { bankItem, results };
          // Now create the merged item here
          const mergedItem = MergedItemService.createMergedItem(baseItem, bankItem);
          matchedItems.push(mergedItem);
          bankInvestMap.delete(bankItem.id);
          break;
        }
      }

      // If no match found, create conflict for base item
      if (!matchFound) {
        const causes: Cause[] = [];
        
        // Use results from the last attempted comparison or create default causes
        if (bestMatch) {
          causes.push(...bestMatch.results
            .filter(result => result.resultCode === ValidationResultCode.UNMATCHED)
            .map(result => ({
              validatorKey: result.validatorKey,
              validatorResultCode: result.resultCode
            }))
          );
        } else {
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

        conflictItems.push({
          ...baseItem,
          causes
        });
      } else if (bestMatch) {
        // If match found but has partial matches, add to conflicts with PARTIAL_MATCH causes
        const partialResults = bestMatch.results.filter(result => result.resultCode === ValidationResultCode.PARTIAL_MATCH);
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
            ...bestMatch.bankItem,
            causes
          });
        }
      }

    });

    // Add remaining bank investments as conflicts
    bankInvestMap.forEach(bankItem => {
      const causes: Cause[] = [
        { validatorKey: ValidatorKey.ATIVO_NAME, validatorResultCode: ValidationResultCode.UNMATCHED }
      ];

      // Check if the bank item is overdue
      if (config.compareDate && bankItem.dataVencimento.isBefore(config.compareDate)) {
        causes.push({ validatorKey: ValidatorKey.OVERDUE_DATE, validatorResultCode: ValidationResultCode.UNMATCHED });
      }

      conflictItems.push({
        ...bankItem,
        causes
      });
    });

    return { matchedItems, conflictItems };
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