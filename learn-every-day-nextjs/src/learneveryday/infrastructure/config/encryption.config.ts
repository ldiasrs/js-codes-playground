import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface EncryptionConfig {
  key: string;
  algorithm: string;
  ivLength: number;
}

interface ConfigFile {
  encryption?: {
    key?: string;
    algorithm?: string;
    ivLength?: number;
  };
}

/**
 * Loads encryption configuration from global-config.prod.json (encryption section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. global-config.prod.json > encryption
 *   2. Environment variables
 */
export class EncryptionConfiguration {
  private static instance: EncryptionConfiguration;
  private config: EncryptionConfig;

  private constructor() {
    let configFromFile: ConfigFile = {};
    try {
      const configPath = path.join(__dirname, '../../../../config/global-config.prod.json');
      if (fs.existsSync(configPath)) {
        const file = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(file) as ConfigFile;
        if (parsed.encryption) {
          configFromFile = parsed;
        }
      }
    } catch {
      // Ignore file errors, fallback to env
    }

    const key = configFromFile.encryption?.key || process.env.ENCRYPTION_KEY;
    const algorithm = configFromFile.encryption?.algorithm || process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    const ivLength = configFromFile.encryption?.ivLength || parseInt(process.env.ENCRYPTION_IV_LENGTH || '16');

    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable or encryption.key in global-config.prod.json is required');
    }

    if (key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }

    this.config = {
      key,
      algorithm,
      ivLength
    };
  }

  public static getInstance(): EncryptionConfiguration {
    if (!EncryptionConfiguration.instance) {
      EncryptionConfiguration.instance = new EncryptionConfiguration();
    }
    return EncryptionConfiguration.instance;
  }

  public getConfig(): EncryptionConfig {
    return this.config;
  }

  public getKey(): string {
    return this.config.key;
  }

  public getAlgorithm(): string {
    return this.config.algorithm;
  }

  public getIvLength(): number {
    return this.config.ivLength;
  }

  public static resetInstance(): void {
    if (EncryptionConfiguration.instance) {
      EncryptionConfiguration.instance = undefined as unknown as EncryptionConfiguration;
    }
  }
} 