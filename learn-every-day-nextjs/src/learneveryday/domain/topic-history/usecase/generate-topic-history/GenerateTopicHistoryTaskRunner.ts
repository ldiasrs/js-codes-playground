import { TaskProcess } from '../../../taskprocess/entities/TaskProcess';
import { TaskProcessRunner } from '../../../taskprocess/ports/TaskProcessRunner';
import { TopicHistory } from '../../entities/TopicHistory';
import { TopicRepositoryPort } from '../../../topic/ports/TopicRepositoryPort';
import { LoggerPort } from '../../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../../taskprocess/ports/TaskProcessRepositoryPort';
import { Topic } from '../../../topic/entities/Topic';
import { GenerateAndSaveTopicHistoryFeature } from './GenerateAndSaveTopicHistoryFeature';

export class GenerateTopicHistoryTaskRunner implements TaskProcessRunner {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly generateAndSaveTopicHistoryFeature: GenerateAndSaveTopicHistoryFeature,
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
    const newHistory = await this.generateAndSaveTopicHistoryFeature.execute(topic);
    await this.scheduleSendTaskIfNeeded(newHistory, topic);
    await this.scheduleRegenerateTaskIfNeeded(topic);
    await this.scheduleCloseTopicTaskIfNeeded(topic);
    await this.scheduleProcessFailedTopicTaskIfNeeded(topic);
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
   * Schedules a send task for the generated topic history if no pending one exists
   * @param newHistory The newly created topic history
   * @param topic The topic associated with the history
   */
  private async scheduleSendTaskIfNeeded(newHistory: TopicHistory, topic: Topic): Promise<void> {
    const hasPendingSendTask = await this.hasPendingSendTask(newHistory.id);
    
    if (hasPendingSendTask) {
      this.logSkippedSendTask(newHistory, topic);
      return;
    }

    await this.createSendTask(newHistory, topic);
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
   * Checks if there's a pending send task for the topic history
   * @param topicHistoryId The topic history ID to check
   * @returns Promise<boolean> True if a pending task exists
   */
  private async hasPendingSendTask(topicHistoryId: string): Promise<boolean> {
    const existingSendTasks = await this.taskProcessRepository.searchProcessedTasks({
      entityId: topicHistoryId,
      type: TaskProcess.SEND_TOPIC_HISTORY,
      status: 'pending'
    });
    
    return existingSendTasks.length > 0;
  }

  /**
   * Creates and saves a new send task for the topic history
   * @param newHistory The topic history to create send task for
   * @param topic The topic associated with the history
   */
  private async createSendTask(newHistory: TopicHistory, topic: Topic): Promise<void> {
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
   * Logs when send task creation is skipped
   * @param newHistory The topic history for which send task was skipped
   * @param topic The topic associated with the history
   */
  private logSkippedSendTask(newHistory: TopicHistory, topic: Topic): void {
    this.logger.info(`Skipped creating send topic history task for history ${newHistory.id} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId,
      historyId: newHistory.id
    });
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

  /**
   * Schedules a close topic task if no pending one exists for the customer
   * @param topic The topic to potentially schedule close topic task for
   */
  private async scheduleCloseTopicTaskIfNeeded(topic: Topic): Promise<void> {
    const hasPendingCloseTopicTask = await this.hasPendingCloseTopicTask(topic.customerId);
    
    if (hasPendingCloseTopicTask) {
      this.logSkippedCloseTopicTask(topic);
      return;
    }

    await this.createCloseTopicTask(topic);
  }

  /**
   * Checks if there's a pending close topic task for the customer
   * @param customerId The customer ID to check
   * @returns Promise<boolean> True if a pending task exists
   */
  private async hasPendingCloseTopicTask(customerId: string): Promise<boolean> {
    const existingCloseTopicTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      type: TaskProcess.CLOSE_TOPIC,
      status: 'pending'
    });
    
    return existingCloseTopicTasks.length > 0;
  }

  /**
   * Creates and saves a new close topic task for the customer
   * @param topic The topic to create close topic task for
   */
  private async createCloseTopicTask(topic: Topic): Promise<void> {
    const scheduledTimeCloseTopics = new Date();
    const newCloseTopicTaskProcess = this.createCloseTopicTaskProcess(topic, scheduledTimeCloseTopics);
    await this.taskProcessRepository.save(newCloseTopicTaskProcess);

    this.logger.info(`Scheduled close topic task for customer ${topic.customerId}`, {
      topicId: topic.id,
      customerId: topic.customerId,
      scheduledTime: scheduledTimeCloseTopics.toISOString(),
      taskType: TaskProcess.CLOSE_TOPIC
    });
  }


  /**
   * Creates a close topic task process
   * @param topic The topic to create close topic task for
   * @param scheduledTime The scheduled time for the task
   * @returns TaskProcess The created task process
   */
  private createCloseTopicTaskProcess(topic: Topic, scheduledTime: Date): TaskProcess {
    return new TaskProcess(
      topic.id,
      topic.customerId,
      TaskProcess.CLOSE_TOPIC,
      'pending',
      undefined,
      undefined,
      scheduledTime
    );
  }

  /**
   * Logs when close topic task creation is skipped
   * @param topic The topic for which close topic task was skipped
   */
  private logSkippedCloseTopicTask(topic: Topic): void {
    this.logger.info(`Skipped creating close topic task for customer ${topic.customerId} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId
    });
  }

  /**
   * Schedules a process failed topic task if no pending one exists for the customer
   * @param topic The topic to potentially schedule process failed topic task for
   */
  private async scheduleProcessFailedTopicTaskIfNeeded(topic: Topic): Promise<void> {
    const hasPendingProcessFailedTopicTask = await this.hasPendingProcessFailedTopicTask(topic.customerId);
    
    if (hasPendingProcessFailedTopicTask) {
      this.logSkippedProcessFailedTopicTask(topic);
      return;
    }

    await this.createProcessFailedTopicTask(topic);
  }

  /**
   * Checks if there's a pending process failed topic task for the customer
   * @param customerId The customer ID to check
   * @returns Promise<boolean> True if a pending task exists
   */
  private async hasPendingProcessFailedTopicTask(customerId: string): Promise<boolean> {
    const existingProcessFailedTopicTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      type: TaskProcess.PROCESS_FAILED_TOPICS,
      status: 'pending'
    });
    
    return existingProcessFailedTopicTasks.length > 0;
  }

  /**
   * Creates and saves a new process failed topic task for the customer
   * @param topic The topic to create process failed topic task for
   */
  private async createProcessFailedTopicTask(topic: Topic): Promise<void> {
    const scheduledTimeProcessFailedTopics = new Date();
    const newProcessFailedTopicTaskProcess = this.createProcessFailedTopicTaskProcess(topic, scheduledTimeProcessFailedTopics);
    await this.taskProcessRepository.save(newProcessFailedTopicTaskProcess);

    this.logger.info(`Scheduled process failed topic task for customer ${topic.customerId}`, {
      topicId: topic.id,
      customerId: topic.customerId,
      scheduledTime: scheduledTimeProcessFailedTopics.toISOString(),
      taskType: TaskProcess.PROCESS_FAILED_TOPICS
    });
  }

  /**
   * Creates a process failed topic task process
   * @param topic The topic to create process failed topic task for
   * @param scheduledTime The scheduled time for the task
   * @returns TaskProcess The created task process
   */
  private createProcessFailedTopicTaskProcess(topic: Topic, scheduledTime: Date): TaskProcess {
    return new TaskProcess(
      topic.id,
      topic.customerId,
      TaskProcess.PROCESS_FAILED_TOPICS,
      'pending',
      undefined,
      undefined,
      scheduledTime
    );
  }

  /**
   * Logs when process failed topic task creation is skipped
   * @param topic The topic for which process failed topic task was skipped
   */
  private logSkippedProcessFailedTopicTask(topic: Topic): void {
    this.logger.info(`Skipped creating process failed topic task for customer ${topic.customerId} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId
    });
  }
} 