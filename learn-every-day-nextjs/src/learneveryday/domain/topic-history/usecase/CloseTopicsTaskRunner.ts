import { TaskProcess, TaskProcessType } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../taskprocess/ports/TaskProcessRunner";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { TopicRepositoryPort } from "../../topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { LoggerPort } from "../../shared/ports/LoggerPort";
import { Topic } from "../../topic/entities/Topic";
import { CloseTopicFeature } from "../../topic/usecase/CloseTopicFeature";

export class CloseTopicsTaskRunner implements TaskProcessRunner {
  private static readonly MAX_HISTORIES_BEFORE_CLOSE = 4;

  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly closeTopicFeature: CloseTopicFeature,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Executes the close topics task for a specific customer
   * @param taskProcess The task process containing the customer ID
   * @returns Promise<void> Resolves when topics are checked and closed as needed
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const startTime = Date.now();
    const customerId = taskProcess.customerId;

    try {
      this.logger.info(`Starting CloseTopicsTaskRunner for customer ${customerId}`, {
        customerId: customerId
      });

      // Step 1: Check and close topics with more than 5 histories
      await this.checkAndCloseTopicsWithManyHistories(customerId);

      // Step 2: Clean up tasks from closed topics
      await this.removeTasksFromClosedTopics(customerId);

      this.logExecutionCompletion(customerId, startTime);
    } catch (error) {      
      this.handleExecuteError(customerId, error);
      throw error;
    }
  }


  /**
   * Checks for topics with more than 5 histories and closes them
   * @param customerId The customer ID to check topics for
   */
  private async checkAndCloseTopicsWithManyHistories(customerId: string): Promise<void> {
    try {
      const topics = await this.topicRepository.findByCustomerId(customerId);
      await this.processTopics(customerId, topics);
    } catch (error) {
      this.handleCheckAndCloseError(customerId, error);
    }
  }

  private async processTopics(customerId: string, topics: Topic[]): Promise<void> {
    const openTopics = this.getOpenTopics(topics);

    if (this.hasNoOpenTopics(openTopics, customerId)) {
      return;
    }

    const topicsToClose = await this.findTopicsToClose(openTopics);

    if (this.hasTopicsToClose(topicsToClose, customerId)) {
      await this.closeAndNotifyTopics(customerId, topicsToClose);
    }
  }

  private hasNoOpenTopics(openTopics: Topic[], customerId: string): boolean {
    if (openTopics.length === 0) {
      // Consider moving this to a dedicated logging function if it grows in complexity
        this.logger.info(`No open topics found for customer ${customerId}`, {
          customerId: customerId
        });
      return true;
    }

    return false;
  }

  private getOpenTopics(topics: Topic[]): Topic[] {
    return topics.filter(topic => !topic.closed);
  }

  private async findTopicsToClose(openTopics: Topic[]): Promise<Topic[]> {
    const topicsToClose: Topic[] = [];

    for (const topic of openTopics) {
      const shouldClose = await this.shouldCloseTopic(topic.id);
      if (shouldClose) {
        topicsToClose.push(topic);
      }
    }

    return topicsToClose;
  }

  private async shouldCloseTopic(topicId: string): Promise<boolean> {
    const histories = await this.topicHistoryRepository.findByTopicId(topicId);
    return histories.length >= CloseTopicsTaskRunner.MAX_HISTORIES_BEFORE_CLOSE;
  }

  private hasTopicsToClose(topicsToClose: Topic[], customerId: string): boolean {
    if (topicsToClose.length > 0) {
      // Consider moving this to a dedicated logging function if it grows in complexity
      this.logger.info(`Found ${topicsToClose.length} topics to close for customer ${customerId}`, {
        customerId,
        topicsToCloseCount: topicsToClose.length,
        topicIds: topicsToClose.map(t => t.id)
      });
      return true;
    }

    return false;
  }

  private async closeAndNotifyTopics(customerId: string, topicsToClose: Topic[]): Promise<void> {
    for (const topic of topicsToClose) {
      await this.closeAndNotifyTopic(customerId, topic);
    }
  }

  private async closeAndNotifyTopic(customerId: string, topic: Topic): Promise<void> {
    try {
      await this.closeTopicFeature.execute({ id: topic.id });
      this.logTopicClosed(customerId, topic);
    } catch (error) {
      this.handleCloseTopicError(customerId, topic, error);
    }
  }

  private logTopicClosed(customerId: string, topic: Topic): void {
    // Consider moving this to a dedicated logging function if it grows in complexity
    this.logger.info(`Closed topic ${topic.id} due to having more than ${CloseTopicsTaskRunner.MAX_HISTORIES_BEFORE_CLOSE} histories`, {
      topicId: topic.id,
      customerId,
      subject: topic.subject
    });
  }


  private handleCheckAndCloseError(customerId: string, error: unknown): void {
    // Consider moving this to a dedicated error handling class or module if it grows
    this.logger.error(`Error checking and closing topics with many histories for customer ${customerId}`,
      error instanceof Error ? error : new Error(String(error)));
  }

  private handleCloseTopicError(customerId: string, topic: Topic, error: unknown): void {
    // Consider moving this to a dedicated error handling class or module if it grows
    this.logger.error(`Failed to close topic ${topic.id}`, error instanceof Error ? error : new Error(String(error)), {
      customerId: customerId,
      topicId: topic.id
    });
  }

  private handleSendEmailError(customerId: string, topic: Topic, error: unknown): void {
    // Consider moving this to a dedicated error handling class or module if it grows
    this.logger.error(`Failed to send topic closed email for topic ${topic.id}`,
      error instanceof Error ? error : new Error(String(error)), {
      customerId: customerId,
      topicId: topic.id,
      topicSubject: topic.subject
    });
  }

  private handleExecuteError(customerId: string, error: unknown): void {
    this.logger.error(`Failed to execute CloseTopicsTaskRunner for customer ${customerId}`,
      error instanceof Error ? error : new Error(String(error)));
  }
  /**
   * Cancels all tasks associated with closed topics by updating their status to 'cancelled'
   * @param customerId The customer ID to clean up tasks for
   */
  private async removeTasksFromClosedTopics(customerId: string): Promise<void> {
    try {
      const topics = await this.topicRepository.findByCustomerId(customerId);
      await this.cancelTasksForClosedTopics(customerId, topics);
    } catch (error) {
      this.logger.error(`Error cancelling tasks from closed topics for customer ${customerId}`, 
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async cancelTasksForClosedTopics(customerId: string, topics: Topic[]): Promise<void> {
    const closedTopics = this.getClosedTopics(topics);

    if (closedTopics.length === 0) {
      return;
    }

    this.logCancellingTasksForClosedTopics(customerId, closedTopics);

    for (const closedTopic of closedTopics) {
      await this.cancelTasksForTopic(customerId, closedTopic);
    }
  }

  private getClosedTopics(topics: Topic[]): Topic[] {
    return topics.filter(topic => topic.closed);
  }

  private logCancellingTasksForClosedTopics(customerId: string, closedTopics: Topic[]): void {
    this.logger.info(`Found ${closedTopics.length} closed topics for customer ${customerId}, cancelling their tasks`, {
      customerId,
      closedTopicsCount: closedTopics.length,
      closedTopicIds: closedTopics.map(t => t.id)
    });
  }

  private async cancelTasksForTopic(customerId: string, closedTopic: Topic): Promise<void> {
    try {
      const generateTasksCancelled = await this.cancelGenerateTasks(closedTopic.id, 'Topic was closed');
      const sendTasksCancelled = await this.cancelSendTasks(closedTopic.id, 'Topic was closed');

      this.logCancelledTasksForTopic(customerId, closedTopic.id, generateTasksCancelled, sendTasksCancelled);
    } catch (error) {
      this.logger.error(`Failed to cancel tasks for closed topic ${closedTopic.id}`, 
        error instanceof Error ? error : new Error(String(error)), {
          customerId: customerId,
          topicId: closedTopic.id
        });
    }
  }

  private async cancelGenerateTasks(entityId: string, reason: string): Promise<number> {
    return this.cancelTasks(entityId, TaskProcess.GENERATE_TOPIC_HISTORY, reason);
  }

  private async cancelSendTasks(topicId: string, reason: string): Promise<number> {
    let sendTasksCancelled = 0;
    const topicHistories = await this.topicHistoryRepository.findByTopicId(topicId);

    for (const topicHistory of topicHistories) {
      sendTasksCancelled += await this.cancelTasks(topicHistory.id, TaskProcess.SEND_TOPIC_HISTORY, reason);
    }

    return sendTasksCancelled;
  }

  private async cancelTasks(entityId: string, taskType: string, reason: string): Promise<number> {
    let tasksCancelled = 0;
    const tasks = await this.taskProcessRepository.findByEntityIdAndType(entityId, taskType as TaskProcessType);

    for (const task of tasks) {
      if (task.status === 'pending') {
        const cancelledTask = task.updateStatus('cancelled', reason);
        await this.taskProcessRepository.save(cancelledTask);
        tasksCancelled++;
      }
    }

    return tasksCancelled;
  }

  private logCancelledTasksForTopic(customerId: string, topicId: string, generateTasksCancelled: number, sendTasksCancelled: number): void {
    this.logger.info(`Cancelled all pending tasks for closed topic ${topicId}`, {
      topicId: topicId,
      customerId,
      generateTasksCancelled,
      sendTasksCancelled
    });
  }

  private logExecutionCompletion(customerId: string, startTime: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info(`CloseTopicsTaskRunner completed for customer ${customerId}`, {
      customerId,
      executionTimeMs: totalExecutionTime,
    });
  }
} 