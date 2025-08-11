import { TopicHistory } from '../entities/TopicHistory';
import { Topic } from '../../topic/entities/Topic';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { AIPromptExecutorPort } from '../ports/AIPromptExecutorPort';
import { PromptBuilder } from '../services/PromptBuilder';
import { LoggerPort } from '../../shared/ports/LoggerPort';

/**
 * Feature responsible for generating and saving topic history content
 */
export class GenerateAndSaveTopicHistoryFeature {
  constructor(
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly aiPromptExecutorPort: AIPromptExecutorPort,
    private readonly promptBuilder: PromptBuilder,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Generates and saves new topic history content for a given topic
   * @param topic The topic to generate history for
   * @returns Promise<TopicHistory> The newly created topic history
   * @throws Error if AI generation fails or saving fails
   */
  async execute(topic: Topic): Promise<TopicHistory> {
    const existingHistory = await this.topicHistoryRepository.findByTopicId(topic.id);
    
    const prompt = this.promptBuilder.build({
      topicSubject: topic.subject,
      history: existingHistory,
      customerId: topic.customerId
    });

    const generatedContent = await this.aiPromptExecutorPort.execute(prompt, topic.customerId);

    const newHistory = new TopicHistory(topic.id, generatedContent);
    await this.topicHistoryRepository.save(newHistory);

    this.logger.info(`Generated topic history for topic: ${topic.id}`, {
      topicId: topic.id,
      topicSubject: topic.subject,
      customerId: topic.customerId,
      historyId: newHistory.id
    });

    return newHistory;
  }
}
