import { GenerateTopicHistoryPort } from '../../domain/topic-history/ports/GenerateTopicHistoryPort';
import { ChatGptTopicHistoryGenerator } from '../adapters/ChatGptTopicHistoryGenerator';

export class TopicHistoryGeneratorFactory {
  /**
   * Creates a ChatGPT-based topic history generator
   * @param apiKey Optional API key. If not provided, will use environment variable
   * @returns GenerateTopicHistoryPort implementation
   */
  static createChatGptGenerator(apiKey?: string): GenerateTopicHistoryPort {
    return new ChatGptTopicHistoryGenerator(apiKey);
  }

  /**
   * Creates a ChatGPT-based topic history generator using environment variables
   * @returns GenerateTopicHistoryPort implementation
   */
  static createChatGptGeneratorFromEnv(): GenerateTopicHistoryPort {
    return new ChatGptTopicHistoryGenerator();
  }
} 