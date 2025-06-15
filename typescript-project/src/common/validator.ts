/**
 * Generic validation result with customizable key and code types
 */
export interface ValidationResult<Key = string, Code = string> {
  validatorKey: Key;
  resultCode: Code;
}

/**
 * Generic result container for matched and conflict items
 */
export interface ValidatorResult<Matched, Conflict> {
  matchedItems: Matched[];
  conflictItems: Conflict[];
}

/**
 * Abstract base class for validators
 */
export abstract class Validator<Context, Result> {
  abstract readonly key: string;
  abstract validate(context: Context): Result;
}

/**
 * Generic processor interface for validation orchestration
 */
export interface ValidatorProcessor<Context, ValidationResultType> {
  validateComparison(context: Context): {
    isValid: boolean;
    results: ValidationResultType[];
  };
}

/**
 * Generic processor interface for validation processing
 */
export interface ValidationsProcessor<BaseItem, CompareItem, Config, MatchedItem, ConflictItem> {
  processInvestments(
    baseItems: BaseItem[], 
    compareItens: CompareItem[], 
    config: Config
  ): ValidatorResult<MatchedItem, ConflictItem>;
} 