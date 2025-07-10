import { TaskProcess } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../taskprocess/ports/TaskProcessRunner";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { TopicRepositoryPort } from "../../topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { LoggerPort } from "../../shared/ports/LoggerPort";
import { Topic } from "../../topic/entities/Topic";
import { CloseTopicFeature } from "../../topic/usecase/CloseTopicFeature";

export class CloseTopicsTaskRunner implements TaskProcessRunner {
  private static readonly MAX_HISTORIES_BEFORE_CLOSE = 5;

  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly closeTopicFeature: CloseTopicFeature,
    private readonly logger: LoggerPort
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
      this.logger.info(`Starting CloseTopicsTaskRunner for customer ${customerId}`);

      // Step 1: Check and close topics with more than 5 histories
      await this.checkAndCloseTopicsWithManyHistories(customerId);

      // Step 2: Clean up tasks from closed topics
      await this.removeTasksFromClosedTopics(customerId);

      this.logExecutionCompletion(customerId, startTime);
    } catch (error) {
      this.logger.error(`Failed to execute CloseTopicsTaskRunner for customer ${customerId}`, 
        error instanceof Error ? error : new Error(String(error)));
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
      const openTopics = topics.filter(topic => !topic.closed);

      if (openTopics.length === 0) {
        this.logger.info(`No open topics found for customer ${customerId}`);
        return;
      }

      const topicsToClose: Topic[] = [];

      for (const topic of openTopics) {
        const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
        if (histories.length > CloseTopicsTaskRunner.MAX_HISTORIES_BEFORE_CLOSE) {
          topicsToClose.push(topic);
        }
      }

      if (topicsToClose.length > 0) {
        this.logger.info(`Found ${topicsToClose.length} topics to close for customer ${customerId}`, {
          customerId,
          topicsToCloseCount: topicsToClose.length,
          topicIds: topicsToClose.map(t => t.id)
        });

        for (const topic of topicsToClose) {
          try {
            await this.closeTopicFeature.execute({ id: topic.id });
            this.logger.info(`Closed topic ${topic.id} due to having more than ${CloseTopicsTaskRunner.MAX_HISTORIES_BEFORE_CLOSE} histories`, {
              topicId: topic.id,
              customerId,
              subject: topic.subject
            });
          } catch (error) {
            this.logger.error(`Failed to close topic ${topic.id}`, error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking and closing topics with many histories for customer ${customerId}`, 
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Removes all tasks associated with closed topics
   * @param customerId The customer ID to clean up tasks for
   */
  private async removeTasksFromClosedTopics(customerId: string): Promise<void> {
    try {
      const topics = await this.topicRepository.findByCustomerId(customerId);
      const closedTopics = topics.filter(topic => topic.closed);

      if (closedTopics.length === 0) {
        return;
      }

      this.logger.info(`Found ${closedTopics.length} closed topics for customer ${customerId}, removing their tasks`, {
        customerId,
        closedTopicsCount: closedTopics.length,
        closedTopicIds: closedTopics.map(t => t.id)
      });

      for (const closedTopic of closedTopics) {
        try {
          // Remove GENERATE_TOPIC_HISTORY tasks
          const generateTasks = await this.taskProcessRepository.findByEntityIdAndType(
            closedTopic.id, 
            TaskProcess.GENERATE_TOPIC_HISTORY
          );

          for (const task of generateTasks) {
            await this.taskProcessRepository.delete(task.id);
          }

          // Remove SEND_TOPIC_HISTORY tasks for all topic histories of this topic
          const topicHistories = await this.topicHistoryRepository.findByTopicId(closedTopic.id);
          for (const topicHistory of topicHistories) {
            const sendTasks = await this.taskProcessRepository.findByEntityIdAndType(
              topicHistory.id, 
              TaskProcess.SEND_TOPIC_HISTORY
            );

            for (const sendTask of sendTasks) {
              await this.taskProcessRepository.delete(sendTask.id);
            }
          }

          this.logger.info(`Removed all tasks for closed topic ${closedTopic.id}`, {
            topicId: closedTopic.id,
            customerId,
            generateTasksRemoved: generateTasks.length,
            sendTasksRemoved: topicHistories.length
          });
        } catch (error) {
          this.logger.error(`Failed to remove tasks for closed topic ${closedTopic.id}`, 
            error instanceof Error ? error : new Error(String(error)));
        }
      }
    } catch (error) {
      this.logger.error(`Error removing tasks from closed topics for customer ${customerId}`, 
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  private logExecutionCompletion(customerId: string, startTime: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info(`CloseTopicsTaskRunner completed for customer ${customerId}`, {
      customerId,
      executionTimeMs: totalExecutionTime,
    });
  }
} 