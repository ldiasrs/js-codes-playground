import { TaskProcessRunner } from "@/learneveryday/features/taskprocess/application/ports/TaskProcessRunner";
import { TaskProcess } from "@/learneveryday/features/taskprocess/domain/TaskProcess";
import { TopicRepositoryPort } from "@/learneveryday/features/topic/application/ports/TopicRepositoryPort";
import { Topic } from "@/learneveryday/features/topic/domain/Topic";
import { LoggerPort } from "@/learneveryday/shared";
import { GenerateAndSaveTopicHistoryFeature } from "./GenerateAndSaveTopicHistory";
import { CloseTopicTaskScheduler } from "./schedulers/CloseTopicTaskScheduler";
import { ProcessFailedTopicsTaskScheduler } from "./schedulers/ProcessFailedTopicsTaskScheduler";
import { ReGenerateTopicsTaskScheduler } from "./schedulers/ReGenerateTopicsTaskScheduler";
import { SendTopicHistoryTaskScheduler } from "./schedulers/SendTopicHistoryTaskScheduler";

export class ExecuteTopicHistoryGeneration implements TaskProcessRunner {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly generateAndSaveTopicHistoryFeature: GenerateAndSaveTopicHistoryFeature,
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
    const newHistory = await this.generateAndSaveTopicHistoryFeature.execute(topic);
    await this.sendTopicHistoryTaskScheduler.scheduleIfNeeded(newHistory, topic);
    await this.reGenerateTopicsTaskScheduler.scheduleIfNeeded(topic);
    await this.closeTopicTaskScheduler.scheduleIfNeeded(topic);
    await this.processFailedTopicsTaskScheduler.scheduleIfNeeded(topic);
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