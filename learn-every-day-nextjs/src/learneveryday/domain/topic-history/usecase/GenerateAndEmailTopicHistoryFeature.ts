import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { GenerateTopicHistoryTaskRunner } from './generate-topic-history/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryByEmailPort } from '../ports/SendTopicHistoryByEmailPort';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';

export interface GenerateAndEmailTopicHistoryFeatureData {
  topicId: string;
  recipientEmail: string;
}

export class GenerateAndEmailTopicHistoryFeature {
  constructor(
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly sendTopicHistoryPort: SendTopicHistoryByEmailPort
  ) {}

  async execute(data: GenerateAndEmailTopicHistoryFeatureData): Promise<TopicHistory> {
    // Get the topic to find the customerId
    const topic = await this.topicRepository.findById(data.topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${data.topicId} not found`);
    }

    // First, generate the topic history using the task runner
    // Create a proper TaskProcess instance for the runner to work with
    const taskProcess = new TaskProcess(
      data.topicId,
      topic.customerId,
      TaskProcess.GENERATE_TOPIC_HISTORY,
      'running'
    );

    await this.generateTopicHistoryTaskRunner.execute(taskProcess);

    // Get the latest generated topic history
    const topicHistories = await this.topicHistoryRepository.findByTopicId(data.topicId);
    const latestTopicHistory = topicHistories.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    if (!latestTopicHistory) {
      throw new Error(`Failed to generate topic history for topic ID ${data.topicId}`);
    }

    // Send the topic history via email
    await this.sendTopicHistoryPort.send({
      email: data.recipientEmail,
      topicHistory: latestTopicHistory,
      topicSubject: topic.subject,
      customerId: topic.customerId
    });

    return latestTopicHistory;
  }
} 