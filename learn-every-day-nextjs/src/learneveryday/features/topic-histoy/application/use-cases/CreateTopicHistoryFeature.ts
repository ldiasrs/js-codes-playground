import { TopicDTO } from "@/learneveryday/features/topic/application/dto/TopicDTO";
import { LoggerPort } from "@/learneveryday/shared";
import { PromptBuilder, PromptBuilderData } from "../../domain/PromptBuilder";
import { TopicHistory } from "../../domain/TopicHistory";
import { AIPromptExecutorPort } from "../ports/AIPromptExecutorPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { TopicHistoryDTO } from "../dto/TopicHistoryDTO";
import { TopicHistoryMapper } from "../dto/TopicHistoryMapper";

/**
 * Feature responsible for generating and saving topic history content
 */
export class CreateTopicHistoryFeature {
  constructor(
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly aiPromptExecutorPort: AIPromptExecutorPort,
    private readonly promptBuilder: PromptBuilder,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Generates and saves new topic history content for a given topic
   * @param topic The topic DTO to generate history for
   * @returns Promise<TopicHistoryDTO> The newly created topic history DTO
   * @throws Error if AI generation fails or saving fails
   */
  async execute(topic: TopicDTO): Promise<TopicHistoryDTO> {
    const existingHistory = await this.topicHistoryRepository.findByTopicId(topic.id);
    
    const promptData: PromptBuilderData = {
      topicSubject: topic.subject,
      history: existingHistory,
      customerId: topic.customerId
    };
    
    const prompt = this.promptBuilder.build(promptData);
    
    this.logger.info('Generating topic history content', {
      topicId: topic.id,
      topicSubject: topic.subject,
      customerId: topic.customerId,
      existingHistoryCount: existingHistory.length
    });

    const generatedContent = await this.aiPromptExecutorPort.execute(prompt, topic.customerId);

    const newHistory = new TopicHistory(topic.id, generatedContent);
    await this.topicHistoryRepository.save(newHistory);

    this.logger.info(`Generated topic history for topic: ${topic.id}`, {
      topicId: topic.id,
      topicSubject: topic.subject,
      customerId: topic.customerId,
      historyId: newHistory.id,
      contentLength: generatedContent.length
    });

    return TopicHistoryMapper.toDTO(newHistory);
  }
}
