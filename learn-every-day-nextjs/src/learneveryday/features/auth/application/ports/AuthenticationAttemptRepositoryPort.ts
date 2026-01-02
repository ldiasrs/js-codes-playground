import { AuthenticationAttempt } from '../../domain/AuthenticationAttempt';

export interface AuthenticationAttemptRepositoryPort {
  /**
   * Saves an authentication attempt
   */
  save(authenticationAttempt: AuthenticationAttempt): Promise<AuthenticationAttempt>;

  /**
   * Finds an authentication attempt by ID
   */
  findById(id: string): Promise<AuthenticationAttempt | undefined>;

  /**
   * Finds the most recent valid authentication attempt for a customer
   */
  findLatestValidByCustomerId(customerId: string): Promise<AuthenticationAttempt | undefined>;

  /**
   * Finds all authentication attempts for a customer
   */
  findByCustomerId(customerId: string): Promise<AuthenticationAttempt[]>;

  /**
   * Finds all expired authentication attempts
   */
  findExpired(): Promise<AuthenticationAttempt[]>;

  /**
   * Deletes expired authentication attempts
   */
  deleteExpired(): Promise<number>;

  /**
   * Updates an authentication attempt (e.g., mark as used)
   */
  update(authenticationAttempt: AuthenticationAttempt): Promise<AuthenticationAttempt>;
} 