import { TaskProcess } from '../../../../taskprocess/entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../../../../taskprocess/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { Topic } from '../../../../../features/topic/domain/Topic';

/**
 * Schedules PROCESS_FAILED_TOPICS tasks when needed.
 */
export class ProcessFailedTopicsTaskScheduler {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Schedule a process-failed-topics task for the topic's customer if there is no pending one.
   */
  async scheduleIfNeeded(topic: Topic): Promise<void> {
    const hasPending = await this.hasPendingProcessFailedTopicTask(topic.customerId);
    if (hasPending) {
      this.logSkippedProcessFailedTopicTask(topic);
      return;
    }
    await this.createProcessFailedTopicTask(topic);
  }

  private async hasPendingProcessFailedTopicTask(customerId: string): Promise<boolean> {
    const existingTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      type: TaskProcess.PROCESS_FAILED_TOPICS,
      status: 'pending'
    });
    return existingTasks.length > 0;
  }

  private async createProcessFailedTopicTask(topic: Topic): Promise<void> {
    const scheduledTime = new Date();
    const task = this.createProcessFailedTopicTaskProcess(topic, scheduledTime);
    await this.taskProcessRepository.save(task);
    this.logger.info(`Scheduled process failed topic task for customer ${topic.customerId}`, {
      topicId: topic.id,
      customerId: topic.customerId,
      scheduledTime: scheduledTime.toISOString(),
      taskType: TaskProcess.PROCESS_FAILED_TOPICS
    });
  }

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

  private logSkippedProcessFailedTopicTask(topic: Topic): void {
    this.logger.info(`Skipped creating process failed topic task for customer ${topic.customerId} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId
    });
  }
}


