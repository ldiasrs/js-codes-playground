import { TopicHistory } from '../../entities/TopicHistory';
import { Topic } from '../../../topic/entities/Topic';
import { TopicHistoryRepositoryPort } from '../../ports/TopicHistoryRepositoryPort';
import { AIPromptExecutorPort } from '../../ports/AIPromptExecutorPort';
import { PromptBuilder, MainTopicsPromptData, DetailedContentPromptData } from '../../services/PromptBuilder';
import { LoggerPort } from '../../../shared/ports/LoggerPort';

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
   * Uses a two-step approach:
   * 1. Get the 9 main content topics from AI
   * 2. Generate detailed content ensuring no duplication with history
   * @param topic The topic to generate history for
   * @returns Promise<TopicHistory> The newly created topic history
   * @throws Error if AI generation fails or saving fails
   */
  async execute(topic: Topic): Promise<TopicHistory> {
    const existingHistory = await this.topicHistoryRepository.findByTopicId(topic.id);
    
    // Step 1: Execute AI prompt to get the 9 main content topics
    const mainTopicsPromptData: MainTopicsPromptData = {
      topicSubject: topic.subject,
      history: existingHistory,
      customerId: topic.customerId
    };
    
    const mainTopicsPrompt = this.promptBuilder.buildMainTopicsPrompt(mainTopicsPromptData);
    
    this.logger.info('Executing step 1: Getting main content topics', {
      topicId: topic.id,
      topicSubject: topic.subject,
      customerId: topic.customerId,
      existingHistoryCount: existingHistory.length
    });

    const mainTopicsResponse = await this.aiPromptExecutorPort.execute(mainTopicsPrompt, topic.customerId);

    // Step 2: Create detailed content prompt using the main topics and ensuring no duplication
    const detailedContentPromptData: DetailedContentPromptData = {
      topicSubject: topic.subject,
      mainTopics: mainTopicsResponse,
      history: existingHistory,
      customerId: topic.customerId
    };

    const detailedContentPrompt = this.promptBuilder.buildDetailedContentPrompt(detailedContentPromptData);

    this.logger.info('Executing step 2: Generating detailed content', {
      topicId: topic.id,
      topicSubject: topic.subject,
      customerId: topic.customerId,
      mainTopicsLength: mainTopicsResponse.length
    });

    const generatedContent = await this.aiPromptExecutorPort.execute(detailedContentPrompt, topic.customerId);

    const newHistory = new TopicHistory(topic.id, generatedContent);
    await this.topicHistoryRepository.save(newHistory);

    this.logger.info(`Generated topic history for topic: ${topic.id}`, {
      topicId: topic.id,
      topicSubject: topic.subject,
      customerId: topic.customerId,
      historyId: newHistory.id,
      contentLength: generatedContent.length,
      mainTopicsCount: mainTopicsResponse.split('\n').filter(line => line.trim().match(/^\d+\./)).length
    });

    return newHistory;
  }
}
