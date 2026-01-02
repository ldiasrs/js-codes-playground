import { TaskProcessRunner } from "@/learneveryday/features/taskprocess/application/ports/TaskProcessRunner";
import { TaskProcess } from "@/learneveryday/features/taskprocess/domain/TaskProcess";
import { TopicRepositoryPort } from "@/learneveryday/features/topic/application/ports/TopicRepositoryPort";
import { Topic } from "@/learneveryday/features/topic/domain/Topic";
import { TopicMapper } from "@/learneveryday/features/topic/application/dto/TopicMapper";
import { LoggerPort } from "@/learneveryday/shared";
import { GenerateTopicHistoryFeature } from "../../../topic-histoy/application/use-cases/GenerateTopicHistoryFeature";
import { CloseTopicTaskScheduler } from "../services/schedulers/CloseTopicTaskScheduler";
import { ProcessFailedTopicsTaskScheduler } from "../services/schedulers/ProcessFailedTopicsTaskScheduler";
import { ReGenerateTopicsTaskScheduler } from "../services/schedulers/ReGenerateTopicsTaskScheduler";
import { SendTopicHistoryTaskScheduler } from "../services/schedulers/SendTopicHistoryTaskScheduler";

export class ExecuteTopicHistoryGeneration implements TaskProcessRunner {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly generateAndSaveTopicHistoryFeature: GenerateTopicHistoryFeature,
    private readonly sendTopicHistoryTaskScheduler: SendTopicHistoryTaskScheduler,
    private readonly reGenerateTopicsTaskScheduler: ReGenerateTopicsTaskScheduler,
    private readonly closeTopicTaskScheduler: CloseTopicTaskScheduler,
    private readonly processFailedTopicsTaskScheduler: ProcessFailedTopicsTaskScheduler,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the topic history generation task
   * @param taskProcess The task process containing the topic ID in entityId
   * @returns Promise<void> Resolves when topic history is generated and saved successfully
   * @throws Error if topic doesn't exist, generation fails, or saving fails
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const topicId = taskProcess.entityId;
    
    const topic = await this.validateAndGetTopic(topicId);
    const topicDTO = TopicMapper.toDTO(topic);
    const newHistoryDTO = await this.generateAndSaveTopicHistoryFeature.execute(topicDTO);
    await this.sendTopicHistoryTaskScheduler.scheduleIfNeeded(newHistoryDTO, topicDTO);
    await this.reGenerateTopicsTaskScheduler.scheduleIfNeeded(topicDTO);
    await this.closeTopicTaskScheduler.scheduleIfNeeded(topicDTO);
    await this.processFailedTopicsTaskScheduler.scheduleIfNeeded(topicDTO);
  }

  /**
   * Validates that the topic exists and is not closed
   * @param topicId The ID of the topic to validate
   * @returns Promise<Topic> The validated topic
   * @throws Error if topic doesn't exist or is closed
   */
  private async validateAndGetTopic(topicId: string): Promise<Topic> {
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    if (topic.closed) {
      this.logger.info(`Skipping topic history generation for closed topic: ${topicId}`, {
        topicId: topic.id,
        customerId: topic.customerId,
        subject: topic.subject
      });
      throw new Error(`Topic with ID ${topicId} is closed and cannot generate more history`);
    }

    return topic;
  }



  
} 