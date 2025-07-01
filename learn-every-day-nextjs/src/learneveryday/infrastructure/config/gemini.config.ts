import dotenv from 'dotenv';

dotenv.config();

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface ConfigFile {
  gemini?: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

/**
 * Loads Gemini configuration from APP_GLOBAL_CONFIG environment variable (gemini section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. APP_GLOBAL_CONFIG > gemini
 *   2. Environment variables
 */
export class GeminiConfiguration {
  private static instance: GeminiConfiguration;
  private config: GeminiConfig;

  private constructor() {
    let configFromEnv: ConfigFile = {};
    try {
      const globalConfig = process.env.APP_GLOBAL_CONFIG;
      if (globalConfig) {
        const parsed = JSON.parse(globalConfig) as ConfigFile;
        if (parsed.gemini) {
          configFromEnv = parsed;
        }
      }
    } catch {
      // Ignore JSON parsing errors, fallback to individual env vars
    }

    const apiKey = configFromEnv.gemini?.apiKey || process.env.GEMINI_API_KEY;
    const model = configFromEnv.gemini?.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const maxTokens = configFromEnv.gemini?.maxTokens || parseInt(process.env.GEMINI_MAX_TOKENS || '2000');
    const temperature = configFromEnv.gemini?.temperature || parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable or gemini.apiKey in APP_GLOBAL_CONFIG is required');
    }

    this.config = {
      apiKey,
      model,
      maxTokens,
      temperature
    };
  }

  public static getInstance(): GeminiConfiguration {
    if (!GeminiConfiguration.instance) {
      GeminiConfiguration.instance = new GeminiConfiguration();
    }
    return GeminiConfiguration.instance;
  }

  public getConfig(): GeminiConfig {
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

  public getTemperature(): number {
    return this.config.temperature;
  }

  public static resetInstance(): void {
    if (GeminiConfiguration.instance) {
      GeminiConfiguration.instance = undefined as unknown as GeminiConfiguration;
    }
  }
} 