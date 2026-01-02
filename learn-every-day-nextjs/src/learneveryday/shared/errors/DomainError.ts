/**
 * DomainError represents a business/domain level error with a machine-readable code.
 */
export class DomainError extends Error {
  public readonly code: string;
  // Common domain error codes
  static readonly CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND';
  static readonly TOPIC_LIMIT_REACHED = 'TOPIC_LIMIT_REACHED';
  static readonly TOPIC_ALREADY_EXISTS = 'TOPIC_ALREADY_EXISTS';
  static readonly TASK_SCHEDULING_FAILED = 'TASK_SCHEDULING_FAILED';
  static readonly TOPIC_NOT_FOUND = 'TOPIC_NOT_FOUND';
  static readonly TOPIC_ALREADY_CLOSED = 'TOPIC_ALREADY_CLOSED';
  static readonly TOPIC_CANNOT_BE_UPDATED = 'TOPIC_CANNOT_BE_UPDATED';
  static readonly CUSTOMER_DELETION_FAILED = 'CUSTOMER_DELETION_FAILED';
  static readonly TOPIC_DELETION_FAILED = 'TOPIC_DELETION_FAILED';
  static readonly INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT';
  static readonly INVALID_VERIFICATION_CODE_FORMAT = 'INVALID_VERIFICATION_CODE_FORMAT';
  static readonly INVALID_TOPIC_SUBJECT = 'INVALID_TOPIC_SUBJECT';
  static readonly CUSTOMER_EMAIL_ALREADY_EXISTS = 'CUSTOMER_EMAIL_ALREADY_EXISTS';
  static readonly CUSTOMER_IDENTIFICATION_ALREADY_EXISTS = 'CUSTOMER_IDENTIFICATION_ALREADY_EXISTS';

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}


