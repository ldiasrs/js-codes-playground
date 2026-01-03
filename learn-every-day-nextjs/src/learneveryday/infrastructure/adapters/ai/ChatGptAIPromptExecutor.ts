import OpenAI from 'openai';
import { AIPromptExecutorPort } from '../../features/topic-histoy/application/ports/AIPromptExecutorPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { OpenAIConfiguration } from '../config/openai.config';

export class ChatGptAIPromptExecutor implements AIPromptExecutorPort {
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfiguration;

  constructor(private readonly logger: LoggerPort) {
    this.config = OpenAIConfiguration.getInstance();
    this.openai = new OpenAI({
      apiKey: this.config.getApiKey(),
    });
  }

  async execute(prompt: string, customerId?: string): Promise<string> {
    try {
      this.logger.info('Executing AI prompt using ChatGPT', { 
        customerId: customerId || "not-provided",
        promptLength: prompt.length 
      });

      const response = await this.openai.chat.completions.create({
        model: this.config.getModel(),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates learning history entries. You should create engaging, informative content that builds upon previous learning experiences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.getMaxTokens(),
        temperature: 0.7
      });

      const generatedContent = response.choices[0]?.message?.content;
      
      if (!generatedContent) {
        throw new Error('No content generated from ChatGPT');
      }

      this.logger.info('AI prompt executed successfully', { 
        customerId: customerId || "not-provided",
        contentLength: generatedContent.length 
      });

      return generatedContent.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error executing AI prompt with ChatGPT', error instanceof Error ? error : new Error(errorMessage), { 
        customerId: customerId || "not-provided",
        error: errorMessage
      });
      throw new Error(`Failed to execute AI prompt: ${errorMessage}`);
    }
  }
} 