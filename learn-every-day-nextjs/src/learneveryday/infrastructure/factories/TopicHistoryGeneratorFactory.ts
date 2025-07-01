import { GenerateTopicHistoryPort } from '../../domain/topic-history/ports/GenerateTopicHistoryPort';
import { ChatGptTopicHistoryGenerator } from '../adapters/ChatGptTopicHistoryGenerator';
import { GeminiTopicHistoryGenerator } from '../adapters/GeminiTopicHistoryGenerator';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';

export class TopicHistoryGeneratorFactory {
  /**
   * Creates a ChatGPT-based topic history generator
   * @param logger The logger instance
   * @returns GenerateTopicHistoryPort implementation
   */
  static createChatGptGenerator(logger: LoggerPort): GenerateTopicHistoryPort {
    return new ChatGptTopicHistoryGenerator(logger);
  }

  /**
   * Creates a ChatGPT-based topic history generator using environment variables
   * @param logger The logger instance
   * @returns GenerateTopicHistoryPort implementation
   */
  static createChatGptGeneratorFromEnv(logger: LoggerPort): GenerateTopicHistoryPort {
    return new ChatGptTopicHistoryGenerator(logger);
  }

  /**
   * Creates a Gemini-based topic history generator
   * @param logger The logger instance
   * @returns GenerateTopicHistoryPort implementation
   */
  static createGeminiGenerator(logger: LoggerPort): GenerateTopicHistoryPort {
    return new GeminiTopicHistoryGenerator(logger);
  }

  /**
   * Creates a Gemini-based topic history generator using environment variables
   * @param logger The logger instance
   * @returns GenerateTopicHistoryPort implementation
   */
  static createGeminiGeneratorFromEnv(logger: LoggerPort): GenerateTopicHistoryPort {
    return new GeminiTopicHistoryGenerator(logger);
  }
} 