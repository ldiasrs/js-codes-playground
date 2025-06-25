import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

interface ConfigFile {
  openai?: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
  };
}

/**
 * Loads OpenAI configuration from global-config.prod.json (openai section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. global-config.prod.json > openai
 *   2. Environment variables
 */
export class OpenAIConfiguration {
  private static instance: OpenAIConfiguration;
  private config: OpenAIConfig;

  private constructor() {
    let configFromFile: ConfigFile = {};
    try {
      const configPath = path.join(__dirname, '../../../../config/global-config.prod.json');
      if (fs.existsSync(configPath)) {
        const file = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(file) as ConfigFile;
        if (parsed.openai) {
          configFromFile = parsed;
        }
      }
    } catch {
      // Ignore file errors, fallback to env
    }

    const apiKey = configFromFile.openai?.apiKey || process.env.OPENAI_API_KEY;
    const model = configFromFile.openai?.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const maxTokens = configFromFile.openai?.maxTokens || parseInt(process.env.OPENAI_MAX_TOKENS || '2000');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable or openai.apiKey in global-config.prod.json is required');
    }

    this.config = {
      apiKey,
      model,
      maxTokens
    };
  }

  public static getInstance(): OpenAIConfiguration {
    if (!OpenAIConfiguration.instance) {
      OpenAIConfiguration.instance = new OpenAIConfiguration();
    }
    return OpenAIConfiguration.instance;
  }

  public getConfig(): OpenAIConfig {
    return this.config;
  }

  public getApiKey(): string {
    return this.config.apiKey;
  }

  public getModel(): string {
    return this.config.model;
  }

  public getMaxTokens(): number {
    return this.config.maxTokens;
  }

  public static resetInstance(): void {
    if (OpenAIConfiguration.instance) {
      OpenAIConfiguration.instance = undefined as unknown as OpenAIConfiguration;
    }
  }
} 