import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Loads OpenAI configuration from global-config.prod.json (chatgpt_topic_history section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. global-config.prod.json > chatgpt_topic_history
 *   2. Environment variables
 */
export class OpenAIConfiguration {
  private static instance: OpenAIConfiguration;
  private config: OpenAIConfig;

  private constructor() {
    let configFromFile: any = {};
    try {
      const configPath = path.join(__dirname, '../../../../config/global-config.prod.json');
      if (fs.existsSync(configPath)) {
        const file = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(file);
        if (parsed.chatgpt_topic_history) {
          configFromFile = parsed.chatgpt_topic_history;
        }
      }
    } catch (e) {
      // Ignore file errors, fallback to env
    }

    const apiKey = configFromFile.api_key || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable or chatgpt_topic_history.api_key in global-config.prod.json is required');
    }

    this.config = {
      apiKey,
      model: configFromFile.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: configFromFile.max_tokens || parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
      temperature: configFromFile.temperature || parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
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
    return this.config.model || 'gpt-3.5-turbo';
  }

  public getMaxTokens(): number {
    return this.config.maxTokens || 500;
  }

  public getTemperature(): number {
    return this.config.temperature || 0.7;
  }
} 