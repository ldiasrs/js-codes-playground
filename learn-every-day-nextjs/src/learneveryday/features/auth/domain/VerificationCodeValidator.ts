import { DomainError } from '../../../shared/errors/DomainError';

/**
 * Domain service for validating verification code format.
 * Contains pure business logic for code validation.
 */
export class VerificationCodeValidator {
  /**
   * Validates that a verification code has the correct format (6 digits).
   * @param code The verification code to validate
   * @throws DomainError if code format is invalid
   */
  static validateFormat(code: string): void {
    if (!this.isValidFormat(code)) {
      throw new DomainError(
        DomainError.INVALID_VERIFICATION_CODE_FORMAT,
        'Please enter a valid 6-digit verification code'
      );
    }
  }

  /**
   * Checks if a verification code has a valid format (6 digits).
   * @param code The verification code to check
   * @returns boolean True if code format is valid
   */
  static isValidFormat(code: string): boolean {
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }
}

