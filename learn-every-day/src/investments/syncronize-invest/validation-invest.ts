import { Validator, ValidationResult, ValidatorProcessor } from '../../common/validator';
import { InvestmentComparisonContext, ValidatorKey, ValidationResultCode } from './conciliation-invest';

/**
 * Validator for ativo name
 */
export class AtivoNameValidator extends Validator<InvestmentComparisonContext, ValidationResult<ValidatorKey, ValidationResultCode>> {
  readonly key = ValidatorKey.ATIVO_NAME;

  validate(context: InvestmentComparisonContext): ValidationResult<ValidatorKey, ValidationResultCode> {
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
export class PurchaseDateValidator extends Validator<InvestmentComparisonContext, ValidationResult<ValidatorKey, ValidationResultCode>> {
  readonly key = ValidatorKey.PURCHASE_DATE;

  validate(context: InvestmentComparisonContext): ValidationResult<ValidatorKey, ValidationResultCode> {
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
export class DueDateValidator extends Validator<InvestmentComparisonContext, ValidationResult<ValidatorKey, ValidationResultCode>> {
  readonly key = ValidatorKey.DUE_DATE;

  validate(context: InvestmentComparisonContext): ValidationResult<ValidatorKey, ValidationResultCode> {
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
export class AmountValidator extends Validator<InvestmentComparisonContext, ValidationResult<ValidatorKey, ValidationResultCode>> {
  readonly key = ValidatorKey.AMOUNT;

  validate(context: InvestmentComparisonContext): ValidationResult<ValidatorKey, ValidationResultCode> {
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
 * Investment validation orchestrator
 */
export class InvestmentValidator implements ValidatorProcessor<InvestmentComparisonContext, ValidationResult<ValidatorKey, ValidationResultCode>> {
  private validators: Validator<InvestmentComparisonContext, ValidationResult<ValidatorKey, ValidationResultCode>>[] = [
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
    results: ValidationResult<ValidatorKey, ValidationResultCode>[];
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