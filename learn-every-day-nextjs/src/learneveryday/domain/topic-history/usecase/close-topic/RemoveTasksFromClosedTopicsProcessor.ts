import { LoggerPort } from '../../../shared/ports/LoggerPort';
import { Topic } from '../../../topic/entities/Topic';
import { TopicRepositoryPort } from '../../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../ports/TopicHistoryRepositoryPort';
import { TaskProcess, TaskProcessType } from '../../../taskprocess/entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../../../taskprocess/ports/TaskProcessRepositoryPort';

/**
 * Cancels pending tasks related to closed topics for a customer.
 */
export class RemoveTasksFromClosedTopicsProcessor {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(customerId: string): Promise<void> {
    try {
      const topics = await this.topicRepository.findByCustomerId(customerId);
      await this.cancelTasksForClosedTopics(customerId, topics);
    } catch (error) {
      this.logger.error(
        `Error cancelling tasks from closed topics for customer ${customerId}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async cancelTasksForClosedTopics(customerId: string, topics: Topic[]): Promise<void> {
    const closedTopics = topics.filter(topic => topic.closed);
    if (closedTopics.length === 0) {
      return;
    }
    this.logger.info(`Found ${closedTopics.length} closed topics for customer ${customerId}, cancelling their tasks`, {
      customerId,
      closedTopicsCount: closedTopics.length,
      closedTopicIds: closedTopics.map(t => t.id)
    });
    for (const closedTopic of closedTopics) {
      await this.cancelTasksForTopic(customerId, closedTopic);
    }
  }

  private async cancelTasksForTopic(customerId: string, closedTopic: Topic): Promise<void> {
    try {
      const generateTasksCancelled = await this.cancelGenerateTasks(closedTopic.id, 'Topic was closed');
      const sendTasksCancelled = await this.cancelSendTasks(closedTopic.id, 'Topic was closed');
      this.logger.info(`Cancelled all pending tasks for closed topic ${closedTopic.id}`, {
        topicId: closedTopic.id,
        customerId,
        generateTasksCancelled,
        sendTasksCancelled
      });
    } catch (error) {
      this.logger.error(
        `Failed to cancel tasks for closed topic ${closedTopic.id}`,
        error instanceof Error ? error : new Error(String(error)),
        { customerId, topicId: closedTopic.id }
      );
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
}


