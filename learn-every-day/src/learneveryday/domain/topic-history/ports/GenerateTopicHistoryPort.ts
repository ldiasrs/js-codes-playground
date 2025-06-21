import { TopicHistory } from '../entities/TopicHistory';

export interface GenerateTopicHistoryPortData {
  topicSubject: string;
  history: TopicHistory[];
}

export interface GenerateTopicHistoryPort {
  /**
   * Generates new topic history content based on the topic subject and existing history
   * @param data The data containing topic subject and history array
   * @returns Promise<string> The generated history content
   * @throws Error if generation fails
   */
  generate(data: GenerateTopicHistoryPortData): Promise<string>;
} 