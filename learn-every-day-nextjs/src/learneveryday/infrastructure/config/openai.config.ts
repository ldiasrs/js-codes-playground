import dotenv from 'dotenv';

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
 * Loads OpenAI configuration from APP_GLOBAL_CONFIG environment variable (openai section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. APP_GLOBAL_CONFIG > openai
 *   2. Environment variables
 */
export class OpenAIConfiguration {
  private static instance: OpenAIConfiguration;
  private config: OpenAIConfig;

  private constructor() {
    let configFromEnv: ConfigFile = {};
    try {
      const globalConfig = process.env.APP_GLOBAL_CONFIG;
      if (globalConfig) {
        const parsed = JSON.parse(globalConfig) as ConfigFile;
        if (parsed.openai) {
          configFromEnv = parsed;
        }
      }
    } catch {
      // Ignore JSON parsing errors, fallback to individual env vars
    }

    const apiKey = configFromEnv.openai?.apiKey || process.env.OPENAI_API_KEY;
    const model = configFromEnv.openai?.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const maxTokens = configFromEnv.openai?.maxTokens || parseInt(process.env.OPENAI_MAX_TOKENS || '2000');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable or openai.apiKey in APP_GLOBAL_CONFIG is required');
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