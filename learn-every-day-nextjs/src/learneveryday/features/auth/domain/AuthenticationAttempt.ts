import { v4 as uuidv4 } from 'uuid';

export class AuthenticationAttempt {
  constructor(
    public readonly customerId: string,
    public readonly encryptedVerificationCode: string,
    public readonly attemptDate: Date = new Date(),
    public readonly expiresAt: Date = new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    public readonly isUsed: boolean = false,
    public readonly id?: string
  ) {
    // Generate ID if not provided
    if (!id) {
      this.id = uuidv4();
    }
  }

  /**
   * Checks if the authentication attempt has expired
   */
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Marks the authentication attempt as used
   */
  public markAsUsed(): AuthenticationAttempt {
    return new AuthenticationAttempt(
      this.customerId,
      this.encryptedVerificationCode,
      this.attemptDate,
      this.expiresAt,
      true,
      this.id
    );
  }

  /**
   * Checks if the authentication attempt is valid (not expired and not used)
   */
  public isValid(): boolean {
    return !this.isExpired() && !this.isUsed;
  }

  /**
   * Creates a new authentication attempt for a customer
   */
  public static createForCustomer(
    customerId: string,
    encryptedVerificationCode: string,
    id?: string
  ): AuthenticationAttempt {
    return new AuthenticationAttempt(
      customerId,
      encryptedVerificationCode,
      new Date(),
      new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      false,
      id
    );
  }
} 