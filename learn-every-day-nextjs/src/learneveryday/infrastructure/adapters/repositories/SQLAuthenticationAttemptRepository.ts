import { AuthenticationAttempt } from '../../../domain/customer/entities/AuthenticationAttempt';
import { AuthenticationAttemptRepositoryPort } from '../../../domain/customer/ports/AuthenticationAttemptRepositoryPort';
import { DatabaseManager } from '../../database/DatabaseManager';
import { EncryptionService } from '../../services/EncryptionService';

interface AuthenticationAttemptData {
  id: string;
  customer_id: string;
  encrypted_verification_code: string;
  attempt_date: string;
  expires_at: string;
  is_used: boolean;
}

export class SQLAuthenticationAttemptRepository implements AuthenticationAttemptRepositoryPort {
  private dbManager: DatabaseManager;
  private encryptionService: EncryptionService;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.encryptionService = new EncryptionService();
  }

  async save(authenticationAttempt: AuthenticationAttempt): Promise<AuthenticationAttempt> {
    const connection = await this.dbManager.getConnection('authentication_attempts');
    
    // Encrypt the verification code before saving
   // const encryptedVerificationCode = this.encryptionService.encrypt(authenticationAttempt.encryptedVerificationCode);
    
    const attemptData: AuthenticationAttemptData = {
      id: authenticationAttempt.id || '',
      customer_id: authenticationAttempt.customerId,
      encrypted_verification_code: authenticationAttempt.encryptedVerificationCode,
      attempt_date: authenticationAttempt.attemptDate.toISOString(),
      expires_at: authenticationAttempt.expiresAt.toISOString(),
      is_used: authenticationAttempt.isUsed
    };

    await connection.query(
      `INSERT OR REPLACE INTO authentication_attempts 
       (id, customer_id, encrypted_verification_code, attempt_date, expires_at, is_used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        attemptData.id,
        attemptData.customer_id,
        attemptData.encrypted_verification_code,
        attemptData.attempt_date,
        attemptData.expires_at,
        attemptData.is_used
      ]
    );

    return authenticationAttempt;
  }

  async findById(id: string): Promise<AuthenticationAttempt | undefined> {
    const connection = await this.dbManager.getConnection('authentication_attempts');
    
    const rows = await connection.query(
      'SELECT * FROM authentication_attempts WHERE id = ?',
      [id]
    ) as unknown as AuthenticationAttemptData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToAuthenticationAttempt(rows[0]);
  }

  async findLatestValidByCustomerId(customerId: string): Promise<AuthenticationAttempt | undefined> {
    const connection = await this.dbManager.getConnection('authentication_attempts');
    
    const rows = await connection.query(
      `SELECT * FROM authentication_attempts 
       WHERE customer_id = ? AND is_used = 0 AND expires_at > ?
       ORDER BY attempt_date DESC 
       LIMIT 1`,
      [customerId, new Date().toISOString()]
    ) as unknown as AuthenticationAttemptData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToAuthenticationAttempt(rows[0]);
  }

  async findByCustomerId(customerId: string): Promise<AuthenticationAttempt[]> {
    const connection = await this.dbManager.getConnection('authentication_attempts');
    
    const rows = await connection.query(
      'SELECT * FROM authentication_attempts WHERE customer_id = ? ORDER BY attempt_date DESC',
      [customerId]
    ) as unknown as AuthenticationAttemptData[];

    return rows.map(row => this.mapToAuthenticationAttempt(row));
  }

  async findExpired(): Promise<AuthenticationAttempt[]> {
    const connection = await this.dbManager.getConnection('authentication_attempts');
    
    const rows = await connection.query(
      'SELECT * FROM authentication_attempts WHERE expires_at <= ?',
      [new Date().toISOString()]
    ) as unknown as AuthenticationAttemptData[];

    return rows.map(row => this.mapToAuthenticationAttempt(row));
  }

  async deleteExpired(): Promise<number> {
    const connection = await this.dbManager.getConnection('authentication_attempts');
    
    await connection.query(
      'DELETE FROM authentication_attempts WHERE expires_at <= ?',
      [new Date().toISOString()]
    );

    // SQLite doesn't return affected rows count in a standard way
    // We'll return 0 as a placeholder
    return 0;
  }

  async update(authenticationAttempt: AuthenticationAttempt): Promise<AuthenticationAttempt> {
    const connection = await this.dbManager.getConnection('authentication_attempts');
    
    // Re-encrypt the verification code if it has changed
    const encryptedVerificationCode = this.encryptionService.encrypt(authenticationAttempt.encryptedVerificationCode);
    
    await connection.query(
      `UPDATE authentication_attempts 
       SET customer_id = ?, encrypted_verification_code = ?, attempt_date = ?, expires_at = ?, is_used = ?
       WHERE id = ?`,
      [
        authenticationAttempt.customerId,
        encryptedVerificationCode,
        authenticationAttempt.attemptDate.toISOString(),
        authenticationAttempt.expiresAt.toISOString(),
        authenticationAttempt.isUsed,
        authenticationAttempt.id
      ]
    );

    return authenticationAttempt;
  }

  private mapToAuthenticationAttempt(data: AuthenticationAttemptData): AuthenticationAttempt {
    // Decrypt the verification code when mapping from database
    //const decryptedVerificationCode = this.encryptionService.decrypt(data.encrypted_verification_code);
    
    return new AuthenticationAttempt(
      data.customer_id,
      data.encrypted_verification_code,
      new Date(data.attempt_date),
      new Date(data.expires_at),
      data.is_used,
      data.id
    );
  }
} 