import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { TaskProcessRunner } from '../../taskprocess/ports/TaskProcessRunner';
import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { AIPromptExecutorPort } from '../ports/AIPromptExecutorPort';
import { PromptBuilder } from '../services/PromptBuilder';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { Topic } from '../../topic/entities/Topic';

export class GenerateTopicHistoryTaskRunner implements TaskProcessRunner {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly aiPromptExecutorPort: AIPromptExecutorPort,
    private readonly promptBuilder: PromptBuilder,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
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
    const newHistory = await this.generateAndSaveTopicHistory(topic);
    await this.scheduleSendTask(newHistory, topic);
    await this.scheduleRegenerateTaskIfNeeded(topic);
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

  /**
   * Generates and saves new topic history content
   * @param topic The topic to generate history for
   * @returns Promise<TopicHistory> The newly created topic history
   */
  private async generateAndSaveTopicHistory(topic: Topic): Promise<TopicHistory> {
    const existingHistory = await this.topicHistoryRepository.findByTopicId(topic.id);
    
    const prompt = this.promptBuilder.build({
      topicSubject: topic.subject,
      history: existingHistory
    });

    const generatedContent = await this.aiPromptExecutorPort.execute(prompt);

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

  /**
   * Schedules a send task for the generated topic history
   * @param newHistory The newly created topic history
   * @param topic The topic associated with the history
   */
  private async scheduleSendTask(newHistory: TopicHistory, topic: Topic): Promise<void> {
    const scheduledTimeSend = this.calculateSendScheduledTime();
    
    const newSendTaskProcess = this.createSendTaskProcess(newHistory, topic, scheduledTimeSend);
    await this.taskProcessRepository.save(newSendTaskProcess);

    this.logger.info(`Scheduled topic history send task for customer ${topic.customerId} using topic ${topic.id}`, {
      topicId: topic.id,
      customerId: topic.customerId,
      historyId: newHistory.id,
      scheduledTime: scheduledTimeSend.toISOString(),
      taskType: TaskProcess.SEND_TOPIC_HISTORY
    });
  }

  /**
   * Schedules a regenerate task if no pending one exists for the customer
   * @param topic The topic to potentially schedule regeneration for
   */
  private async scheduleRegenerateTaskIfNeeded(topic: Topic): Promise<void> {
    const hasPendingRegenerateTask = await this.hasPendingRegenerateTask(topic.customerId);
    
    if (hasPendingRegenerateTask) {
      this.logSkippedRegenerateTask(topic);
      return;
    }

    await this.createRegenerateTask(topic);
  }

  /**
   * Checks if there's a pending regenerate task for the customer
   * @param customerId The customer ID to check
   * @returns Promise<boolean> True if a pending task exists
   */
  private async hasPendingRegenerateTask(customerId: string): Promise<boolean> {
    const existingRegenerateTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      type: TaskProcess.REGENERATE_TOPICS_HISTORIES,
      status: 'pending'
    });
    
    return existingRegenerateTasks.length > 0;
  }

  /**
   * Creates and saves a new regenerate task for the customer
   * @param topic The topic to create regeneration task for
   */
  private async createRegenerateTask(topic: Topic): Promise<void> {
    const scheduledTimeRegenerate = this.calculateRegenerateScheduledTime();
    
    const newRegenerateTaskProcess = this.createRegenerateTaskProcess(topic, scheduledTimeRegenerate);
    await this.taskProcessRepository.save(newRegenerateTaskProcess);

    this.logger.info(`Scheduled regenerate topic history task for customer ${topic.customerId}`, {
      topicId: topic.id,
      customerId: topic.customerId,
      scheduledTime: scheduledTimeRegenerate.toISOString(),
      taskType: TaskProcess.REGENERATE_TOPICS_HISTORIES
    });
  }

  /**
   * Calculates the scheduled time for send task
   * @returns Date The scheduled time
   */
  private calculateSendScheduledTime(): Date {
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes());
    return scheduledTime;
  }

  /**
   * Calculates the scheduled time for regenerate task
   * @returns Date The scheduled time
   */
  private calculateRegenerateScheduledTime(): Date {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours());
    return scheduledTime;
  }

  /**
   * Creates a send task process
   * @param newHistory The topic history to send
   * @param topic The associated topic
   * @param scheduledTime The scheduled time for the task
   * @returns TaskProcess The created task process
   */
  private createSendTaskProcess(newHistory: TopicHistory, topic: Topic, scheduledTime: Date): TaskProcess {
    return new TaskProcess(
      newHistory.id,
      topic.customerId,
      TaskProcess.SEND_TOPIC_HISTORY,
      'pending',
      undefined,
      undefined,
      scheduledTime
    );
  }

  /**
   * Creates a regenerate task process
   * @param topic The topic to regenerate history for
   * @param scheduledTime The scheduled time for the task
   * @returns TaskProcess The created task process
   */
  private createRegenerateTaskProcess(topic: Topic, scheduledTime: Date): TaskProcess {
    return new TaskProcess(
      topic.id,
      topic.customerId,
      TaskProcess.REGENERATE_TOPICS_HISTORIES,
      'pending',
      undefined,
      undefined,
      scheduledTime
    );
  }

  /**
   * Logs when regenerate task creation is skipped
   * @param topic The topic for which regeneration was skipped
   */
  private logSkippedRegenerateTask(topic: Topic): void {
    this.logger.info(`Skipped creating regenerate topic history task for customer ${topic.customerId} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId
    });
  }
} 