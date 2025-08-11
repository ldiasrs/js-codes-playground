import { TaskProcess } from '../../../../taskprocess/entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../../../../taskprocess/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { Topic } from '../../../../topic/entities/Topic';

/**
 * Schedules REGENERATE_TOPICS_HISTORIES tasks when needed.
 */
export class ReGenerateTopicsTaskScheduler {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Schedule a regenerate task for the topic's customer if there is no pending one.
   */
  async scheduleIfNeeded(topic: Topic): Promise<void> {
    const hasPending = await this.hasPendingRegenerateTask(topic.customerId);
    if (hasPending) {
      this.logSkippedRegenerateTask(topic);
      return;
    }
    await this.createRegenerateTask(topic);
  }

  private async hasPendingRegenerateTask(customerId: string): Promise<boolean> {
    const existingRegenerateTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      type: TaskProcess.REGENERATE_TOPICS_HISTORIES,
      status: 'pending'
    });
    return existingRegenerateTasks.length > 0;
  }

  private async createRegenerateTask(topic: Topic): Promise<void> {
    const scheduledTime = this.calculateRegenerateScheduledTime();
    const task = this.createRegenerateTaskProcess(topic, scheduledTime);
    await this.taskProcessRepository.save(task);
    this.logger.info(`Scheduled regenerate topic history task for customer ${topic.customerId}`, {
      topicId: topic.id,
      customerId: topic.customerId,
      scheduledTime: scheduledTime.toISOString(),
      taskType: TaskProcess.REGENERATE_TOPICS_HISTORIES
    });
  }

  private calculateRegenerateScheduledTime(): Date {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours());
    return scheduledTime;
  }

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

  private logSkippedRegenerateTask(topic: Topic): void {
    this.logger.info(`Skipped creating regenerate topic history task for customer ${topic.customerId} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId
    });
  }
}


