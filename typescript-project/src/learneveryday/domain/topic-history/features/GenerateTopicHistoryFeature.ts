import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { GenerateTopicHistoryPort } from '../ports/GenerateTopicHistoryPort';

export interface GenerateTopicHistoryFeatureData {
  topicId: string;
}

export class GenerateTopicHistoryFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly generateTopicHistoryPort: GenerateTopicHistoryPort
  ) {}

  /**
   * Executes the GenerateTopicHistory feature
   * @param data The data containing topicId
   * @returns Promise<TopicHistory> The generated and saved topic history entry
   * @throws Error if topic doesn't exist, generation fails, or saving fails
   */
  async execute(data: GenerateTopicHistoryFeatureData): Promise<TopicHistory> {
    const { topicId } = data;

    // Step 1: Verify topic exists
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Step 2: Get existing history for context
    const existingHistory = await this.topicHistoryRepository.findByTopicId(topicId);

    // Step 3: Generate new content using the port
    const generatedContent = await this.generateTopicHistoryPort.generate({
      topicSubject: topic.subject,
      history: existingHistory
    });

    // Step 4: Create and save the new history entry
    const newHistory = new TopicHistory(topicId, generatedContent);
    const savedHistory = await this.topicHistoryRepository.save(newHistory);

    return savedHistory;
  }
} 