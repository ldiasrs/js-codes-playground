import { TaskProcessRepositoryPort } from '../ports/TaskProcessRepositoryPort';
import { TaskProcess } from '../../domain/TaskProcess';
import { TaskProcessFactory } from '../../domain/factories/TaskProcessFactory';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Application service for scheduling topic history generation tasks.
 * Encapsulates the orchestration logic for task scheduling.
 */
export interface TopicHistoryTaskScheduler {
  scheduleForTopic(topicId: string, customerId: string): Promise<void>;
}

export class TopicHistoryTaskSchedulerService implements TopicHistoryTaskScheduler {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Schedules a topic history generation task for the given topic.
   * @param topicId The topic ID
   * @param customerId The customer ID
   * @throws Error if task creation fails
   */
  async scheduleForTopic(topicId: string, customerId: string): Promise<void> {
    const taskProcess = TaskProcessFactory.createTopicHistoryGenerationTask(topicId, customerId);

    await this.taskProcessRepository.save(taskProcess);

    this.logger.info(`Scheduled topic history generation task for topic ${topicId}`, {
      topicId,
      customerId,
      taskType: TaskProcess.GENERATE_TOPIC_HISTORY
    });
  }
}

