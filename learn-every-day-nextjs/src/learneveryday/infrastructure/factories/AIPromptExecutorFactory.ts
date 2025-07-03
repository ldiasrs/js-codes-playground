import { AIPromptExecutorPort } from '../../domain/topic-history/ports/AIPromptExecutorPort';
import { ChatGptAIPromptExecutor } from '../adapters/ChatGptAIPromptExecutor';
import { GeminiAIPromptExecutor } from '../adapters/GeminiAIPromptExecutor';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';

export class AIPromptExecutorFactory {
  /**
   * Creates a ChatGPT-based AI prompt executor
   * @param logger The logger instance
   * @returns AIPromptExecutorPort implementation
   */
  static createChatGptExecutor(logger: LoggerPort): AIPromptExecutorPort {
    return new ChatGptAIPromptExecutor(logger);
  }

  /**
   * Creates a ChatGPT-based AI prompt executor using environment variables
   * @param logger The logger instance
   * @returns AIPromptExecutorPort implementation
   */
  static createChatGptExecutorFromEnv(logger: LoggerPort): AIPromptExecutorPort {
    return new ChatGptAIPromptExecutor(logger);
  }

  /**
   * Creates a Gemini-based AI prompt executor
   * @param logger The logger instance
   * @returns AIPromptExecutorPort implementation
   */
  static createGeminiExecutor(logger: LoggerPort): AIPromptExecutorPort {
    return new GeminiAIPromptExecutor(logger);
  }

  /**
   * Creates a Gemini-based AI prompt executor using environment variables
   * @param logger The logger instance
   * @returns AIPromptExecutorPort implementation
   */
  static createGeminiExecutorFromEnv(logger: LoggerPort): AIPromptExecutorPort {
    return new GeminiAIPromptExecutor(logger);
  }
} 