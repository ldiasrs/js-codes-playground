import { TopicHistory } from '../entities/TopicHistory';

export interface SendTopicHistoryByEmailPortData {
  email: string;
  topicHistory: TopicHistory;
  topicSubject?: string;
}

export interface SendTopicHistoryByEmailPort {
  /**
   * Sends topic history content by email
   * @param data The data containing email, topic history, and optional topic subject
   * @returns Promise<void> Resolves when email is sent successfully
   * @throws Error if email sending fails
   */
  send(data: SendTopicHistoryByEmailPortData): Promise<void>;
} 