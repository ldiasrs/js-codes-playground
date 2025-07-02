import dotenv from 'dotenv';

dotenv.config();

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  algorithm: 'HS256' | 'HS384' | 'HS512';
}

interface ConfigFile {
  jwt?: {
    secret?: string;
    expiresIn?: string;
    issuer?: string;
    algorithm?: 'HS256' | 'HS384' | 'HS512';
  };
}

/**
 * Loads JWT configuration from APP_GLOBAL_CONFIG environment variable (jwt section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. APP_GLOBAL_CONFIG > jwt
 *   2. Environment variables
 */
export class JwtConfiguration {
  private static instance: JwtConfiguration;
  private config: JwtConfig;

  private constructor() {
    let configFromEnv: ConfigFile = {};
    try {
      const globalConfig = process.env.APP_GLOBAL_CONFIG;
      if (globalConfig) {
        const parsed = JSON.parse(globalConfig) as ConfigFile;
        if (parsed.jwt) {
          configFromEnv = parsed;
        }
      }
    } catch {
      // Ignore JSON parsing errors, fallback to individual env vars
    }

    const secret = configFromEnv.jwt?.secret || process.env.JWT_SECRET;
    const expiresIn = configFromEnv.jwt?.expiresIn || process.env.JWT_EXPIRES_IN || '24h';
    const issuer = configFromEnv.jwt?.issuer || process.env.JWT_ISSUER || 'learn-every-day';
    const algorithm = configFromEnv.jwt?.algorithm || (process.env.JWT_ALGORITHM as 'HS256' | 'HS384' | 'HS512') || 'HS256';

    if (!secret) {
      throw new Error('JWT_SECRET environment variable or jwt.secret in APP_GLOBAL_CONFIG is required');
    }

    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long for security');
    }

    this.config = {
      secret,
      expiresIn,
      issuer,
      algorithm
    };
  }

  public static getInstance(): JwtConfiguration {
    if (!JwtConfiguration.instance) {
      JwtConfiguration.instance = new JwtConfiguration();
    }
    return JwtConfiguration.instance;
  }

  public getConfig(): JwtConfig {
    return this.config;
  }

  public getSecret(): string {
    return this.config.secret;
  }

  public getExpiresIn(): string {
    return this.config.expiresIn;
  }

  public getIssuer(): string {
    return this.config.issuer;
  }

  public getAlgorithm(): 'HS256' | 'HS384' | 'HS512' {
    return this.config.algorithm;
  }

  public static resetInstance(): void {
    if (JwtConfiguration.instance) {
      JwtConfiguration.instance = undefined as unknown as JwtConfiguration;
    }
  }
} 