import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { SendTopicHistoryByEmailPort } from '../ports/SendTopicHistoryByEmailPort';
import { GenerateTopicHistoryFeature } from './GenerateTopicHistoryFeature';

export interface GenerateAndEmailTopicHistoryFeatureData {
  topicId: string;
  recipientEmail: string;
}

export class GenerateAndEmailTopicHistoryFeature {
  constructor(
    private readonly generateTopicHistoryFeature: GenerateTopicHistoryFeature,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly sendTopicHistoryByEmailPort: SendTopicHistoryByEmailPort
  ) {}

  /**
   * Executes the GenerateAndEmailTopicHistory feature
   * @param data The data containing topicId and recipientEmail
   * @returns Promise<TopicHistory> The generated and saved topic history entry
   * @throws Error if topic doesn't exist, generation fails, or email sending fails
   */
  async execute(data: GenerateAndEmailTopicHistoryFeatureData): Promise<TopicHistory> {
    const { topicId, recipientEmail } = data;

    // Step 1: Get topic to retrieve the subject for email
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Step 2: Generate topic history using the dedicated feature
    const savedHistory = await this.generateTopicHistoryFeature.execute({ topicId });

    // Step 3: Send the topic history by email
    await this.sendTopicHistoryByEmailPort.send({
      email: recipientEmail,
      topicHistory: savedHistory,
      topicSubject: topic.subject
    });

    return savedHistory;
  }
} 