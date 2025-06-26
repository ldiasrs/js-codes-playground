import dotenv from 'dotenv';

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
 * Loads encryption configuration from APP_GLOBAL_CONFIG environment variable (encryption section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. APP_GLOBAL_CONFIG > encryption
 *   2. Environment variables
 */
export class EncryptionConfiguration {
  private static instance: EncryptionConfiguration;
  private config: EncryptionConfig;

  private constructor() {
    let configFromEnv: ConfigFile = {};
    try {
      const globalConfig = process.env.APP_GLOBAL_CONFIG;
      if (globalConfig) {
        const parsed = JSON.parse(globalConfig) as ConfigFile;
        if (parsed.encryption) {
          configFromEnv = parsed;
        }
      }
    } catch {
      // Ignore JSON parsing errors, fallback to individual env vars
    }

    const key = configFromEnv.encryption?.key || process.env.ENCRYPTION_KEY;
    const algorithm = configFromEnv.encryption?.algorithm || process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    const ivLength = configFromEnv.encryption?.ivLength || parseInt(process.env.ENCRYPTION_IV_LENGTH || '16');

    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable or encryption.key in APP_GLOBAL_CONFIG is required');
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