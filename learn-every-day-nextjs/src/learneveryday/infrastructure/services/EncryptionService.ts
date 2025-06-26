import * as crypto from 'crypto';
import { EncryptionConfiguration } from '../config/encryption.config';

export class EncryptionService {
  private readonly config: EncryptionConfiguration;

  constructor() {
    this.config = EncryptionConfiguration.getInstance();
  }

  /**
   * Encrypts a plain text string
   * @param plaintext The text to encrypt
   * @returns The encrypted text as a base64 string
   */
  public encrypt(plaintext: string): string {
    const algorithm = this.config.getAlgorithm();
    const key = Buffer.from(this.config.getKey(), 'utf8');
    const iv = crypto.randomBytes(this.config.getIvLength());

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Combine IV and encrypted data
    const result = iv.toString('base64') + ':' + encrypted;
    return result;
  }

  /**
   * Decrypts an encrypted string
   * @param encryptedText The encrypted text as a base64 string
   * @returns The decrypted plain text
   */
  public decrypt(encryptedText: string): string {
    const algorithm = this.config.getAlgorithm();
    const key = Buffer.from(this.config.getKey(), 'utf8');

    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generates a secure random key for encryption
   * @param length The length of the key in bytes (default: 32)
   * @returns A base64 encoded key
   */
  public static generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Validates if a key is suitable for encryption
   * @param key The key to validate
   * @returns True if the key is valid
   */
  public static isValidKey(key: string): boolean {
    return key.length >= 32;
  }
} 