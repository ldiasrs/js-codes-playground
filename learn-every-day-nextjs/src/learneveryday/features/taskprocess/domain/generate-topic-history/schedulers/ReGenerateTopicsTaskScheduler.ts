import { TaskProcessRepositoryPort } from "@/learneveryday/features/taskprocess/ports/TaskProcessRepositoryPort";
import { TopicDTO } from "@/learneveryday/features/topic/application/dto/TopicDTO";
import { LoggerPort } from "@/learneveryday/shared";
import { TaskProcess } from "../../api/TaskProcess";

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
  async scheduleIfNeeded(topic: TopicDTO): Promise<void> {
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

  private async createRegenerateTask(topic: TopicDTO): Promise<void> {
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

  private createRegenerateTaskProcess(topic: TopicDTO, scheduledTime: Date): TaskProcess {
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

  private logSkippedRegenerateTask(topic: TopicDTO): void {
    this.logger.info(`Skipped creating regenerate topic history task for customer ${topic.customerId} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId
    });
  }
}


