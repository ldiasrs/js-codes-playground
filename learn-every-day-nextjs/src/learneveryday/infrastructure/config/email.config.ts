import dotenv from 'dotenv';

dotenv.config();

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
}

interface ConfigFile {
  email?: {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    user?: string;
    pass?: string;
    from?: string;
  };
}

/**
 * Loads email configuration from APP_GLOBAL_CONFIG environment variable (email section) if available,
 * otherwise falls back to individual environment variables.
 *
 * Precedence:
 *   1. APP_GLOBAL_CONFIG > email
 *   2. Individual environment variables
 */
export class EmailConfiguration {
  private static instance: EmailConfiguration;
  private config: EmailConfig;

  private constructor() {
    let configFromEnv: ConfigFile = {};
    try {
      const globalConfig = process.env.APP_GLOBAL_CONFIG;
      if (globalConfig) {
        const parsed = JSON.parse(globalConfig) as ConfigFile;
        if (parsed.email) {
          configFromEnv = parsed;
        }
      }
    } catch {
      // Ignore JSON parsing errors, fallback to individual env vars
    }

    const host = configFromEnv.email?.host || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = configFromEnv.email?.port || parseInt(process.env.EMAIL_PORT || '587');
    const secure = configFromEnv.email?.secure || (process.env.EMAIL_SECURE === 'true');
    const username = configFromEnv.email?.username || configFromEnv.email?.user || process.env.EMAIL_USERNAME;
    const password = configFromEnv.email?.password || configFromEnv.email?.pass || process.env.EMAIL_PASSWORD;
    const from = configFromEnv.email?.from || process.env.EMAIL_FROM;

    if (!username || !password) {
      throw new Error('EMAIL_USERNAME and EMAIL_PASSWORD environment variables or email.username/email.user and email.password/email.pass in APP_GLOBAL_CONFIG are required');
    }

    this.config = {
      host,
      port,
      secure,
      username,
      password,
      from: from || username
    };
  }

  public static getInstance(): EmailConfiguration {
    if (!EmailConfiguration.instance) {
      EmailConfiguration.instance = new EmailConfiguration();
    }
    return EmailConfiguration.instance;
  }

  public getConfig(): EmailConfig {
    return this.config;
  }

  public getHost(): string {
    return this.config.host;
  }

  public getPort(): number {
    return this.config.port;
  }

  public isSecure(): boolean {
    return this.config.secure;
  }

  public getUsername(): string {
    return this.config.username;
  }

  public getPassword(): string {
    return this.config.password;
  }

  public getFromEmail(): string {
    return this.config.from;
  }

  public static resetInstance(): void {
    if (EmailConfiguration.instance) {
      EmailConfiguration.instance = undefined as unknown as EmailConfiguration;
    }
  }
} 