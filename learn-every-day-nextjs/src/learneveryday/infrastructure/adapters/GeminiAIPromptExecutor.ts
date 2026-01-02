import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIPromptExecutorPort } from '../../features/topic-histoy/application/ports/AIPromptExecutorPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { GeminiConfiguration } from '../config/gemini.config';

export class GeminiAIPromptExecutor implements AIPromptExecutorPort {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private readonly config: GeminiConfiguration;

  constructor(private readonly logger: LoggerPort) {
    this.config = GeminiConfiguration.getInstance();
    this.genAI = new GoogleGenerativeAI(this.config.getApiKey());
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.getModel(),
      generationConfig: {
        maxOutputTokens: this.config.getMaxTokens(),
        temperature: this.config.getTemperature(),
      },
    });
  }

  async execute(prompt: string, customerId?: string): Promise<string> {
    try {
      this.logger.info('Executing AI prompt using Gemini', { 
        customerId: customerId || "not-provided",
        promptLength: prompt.length 
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedContent = response.text();
      
      if (!generatedContent) {
        throw new Error('No content generated from Gemini');
      }

      this.logger.info('AI prompt executed successfully', { 
        customerId: customerId || "not-provided",
        contentLength: generatedContent.length 
      });

      return generatedContent.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error executing AI prompt with Gemini', error instanceof Error ? error : new Error(errorMessage), { 
        customerId: customerId || "not-provided",
        error: errorMessage
      });
      throw new Error(`Failed to execute AI prompt: ${errorMessage}`);
    }
  }
} 