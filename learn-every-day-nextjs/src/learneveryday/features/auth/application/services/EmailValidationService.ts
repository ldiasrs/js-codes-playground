import { DomainError } from '../../../../shared/errors/DomainError';

/**
 * Application service for email validation.
 * Encapsulates email format validation logic.
 */
export class EmailValidationService {
  /**
   * Validates that an email address has a valid format.
   * @param email The email address to validate
   * @throws DomainError if email format is invalid
   */
  validateEmailFormat(email: string): void {
    if (!this.isValidEmail(email)) {
      throw new DomainError(
        DomainError.INVALID_EMAIL_FORMAT,
        'Please enter a valid email address'
      );
    }
  }

  /**
   * Checks if an email address has a valid format.
   * @param email The email address to check
   * @returns boolean True if email format is valid
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

