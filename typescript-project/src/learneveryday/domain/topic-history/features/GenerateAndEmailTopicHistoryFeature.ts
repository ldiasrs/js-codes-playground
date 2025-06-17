import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { GenerateTopicHistoryFeature } from './GenerateTopicHistoryFeature';
import { SendTopicHistoryByEmailPort } from '../ports/SendTopicHistoryByEmailPort';

export interface GenerateAndEmailTopicHistoryFeatureData {
  topicId: string;
  recipientEmail: string;
}

export class GenerateAndEmailTopicHistoryFeature {
  constructor(
    private readonly generateTopicHistoryFeature: GenerateTopicHistoryFeature,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly sendTopicHistoryPort: SendTopicHistoryByEmailPort
  ) {}

  async execute(data: GenerateAndEmailTopicHistoryFeatureData): Promise<TopicHistory> {
    // First, generate the topic history
    const topicHistory = await this.generateTopicHistoryFeature.execute({
      topicId: data.topicId
    });

    // Get the topic to include in the email
    const topic = await this.topicRepository.findById(data.topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${data.topicId} not found`);
    }

    // Send the topic history via email
    await this.sendTopicHistoryPort.send({
      email: data.recipientEmail,
      topicHistory,
      topicSubject: topic.subject
    });

    return topicHistory;
  }
} 