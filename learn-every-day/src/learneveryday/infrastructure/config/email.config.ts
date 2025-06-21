import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
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
    let configFromFile: any = {};
    try {
      const configPath = path.join(__dirname, '../../../../config/global-config.prod.json');
      if (fs.existsSync(configPath)) {
        const file = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(file);
        if (parsed.email) {
          configFromFile = parsed.email;
        }
      }
    } catch (e) {
      // Ignore file errors, fallback to env
    }

    const host = configFromFile.host || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = configFromFile.port || parseInt(process.env.EMAIL_PORT || '587');
    const secure = configFromFile.secure || (process.env.EMAIL_SECURE === 'true');
    const user = configFromFile.user || process.env.EMAIL_USER;
    const pass = configFromFile.pass || process.env.EMAIL_PASS;
    const from = configFromFile.from || process.env.EMAIL_FROM || user;

    if (!user || !pass) {
      throw new Error('EMAIL_USER and EMAIL_PASS environment variables or email.user and email.pass in global-config.prod.json are required');
    }

    this.config = {
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      from
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

  public getUser(): string {
    return this.config.auth.user;
  }

  public getPass(): string {
    return this.config.auth.pass;
  }

  public getFrom(): string {
    return this.config.from;
  }
} 