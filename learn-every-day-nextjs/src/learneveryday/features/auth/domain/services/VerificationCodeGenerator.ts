/**
 * Domain service for generating verification codes.
 * Contains pure business logic for code generation.
 */
export class VerificationCodeGenerator {
  /**
   * Generates a random 6-digit verification code.
   * @returns string A 6-digit verification code
   */
  static generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

