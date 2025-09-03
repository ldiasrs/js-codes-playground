/**
 * DomainError represents a business/domain level error with a machine-readable code.
 */
export class DomainError extends Error {
  public readonly code: string;
  // Common domain error codes
  static readonly CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND';
  static readonly TOPIC_LIMIT_REACHED = 'TOPIC_LIMIT_REACHED';
  static readonly TOPIC_ALREADY_EXISTS = 'TOPIC_ALREADY_EXISTS';

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}


