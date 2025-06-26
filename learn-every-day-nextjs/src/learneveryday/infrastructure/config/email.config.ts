import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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
    from?: string;
  };
}

/**
 * Loads email configuration from global-config.prod.json (email section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. global-config.prod.json > email
 *   2. Environment variables
 */
export class EmailConfiguration {
  private static instance: EmailConfiguration;
  private config: EmailConfig;

  private constructor() {
    let configFromFile: ConfigFile = {};
    try {
      const configPath = path.join(__dirname, '../../config/global-config.prod.json');
      if (fs.existsSync(configPath)) {
        const file = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(file) as ConfigFile;
        if (parsed.email) {
          configFromFile = parsed;
        }
      }
    } catch {
      // Ignore file errors, fallback to env
    }

    const host = configFromFile.email?.host || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = configFromFile.email?.port || parseInt(process.env.EMAIL_PORT || '587');
    const secure = configFromFile.email?.secure || (process.env.EMAIL_SECURE === 'true');
    const username = configFromFile.email?.username || process.env.EMAIL_USERNAME;
    const password = configFromFile.email?.password || process.env.EMAIL_PASSWORD;
    const from = configFromFile.email?.from || process.env.EMAIL_FROM;

    if (!username || !password) {
      throw new Error('EMAIL_USERNAME and EMAIL_PASSWORD environment variables or email.username and email.password in global-config.prod.json are required');
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