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

// Registration validation functions

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates CPF format (Brazilian format)
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if it has 11 digits
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return false;
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return false;
  }
  
  return true;
};

/**
 * Validates phone number format (basic validation)
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove non-numeric characters
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Check if it has at least 10 digits (Brazilian format)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

/**
 * Validates required field
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates customer name
 */
export const validateCustomerName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

/**
 * Validates government identification content based on type
 */
export const validateGovIdentification = (type: string, content: string): boolean => {
  if (!content.trim()) {
    return false;
  }
  
  switch (type) {
    case 'CPF':
      return validateCPF(content);
    case 'OTHER':
      return content.trim().length >= 3 && content.trim().length <= 50;
    default:
      return false;
  }
}; 