import { TaskProcessRepositoryPort } from "@/learneveryday/features/taskprocess/ports/TaskProcessRepositoryPort";
import { TaskProcess } from "@/learneveryday/features/taskprocess/domain/api/TaskProcess";
import { TopicDTO } from "@/learneveryday/features/topic/application/dto/TopicDTO";
import { LoggerPort } from "@/learneveryday/shared";

/**
 * Schedules CLOSE_TOPIC tasks when needed.
 */
export class CloseTopicTaskScheduler {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Schedule a close-topic task for the topic's customer if there is no pending one.
   */
  async scheduleIfNeeded(topic: TopicDTO): Promise<void> {
    const hasPending = await this.hasPendingCloseTopicTask(topic.customerId);
    if (hasPending) {
      this.logSkippedCloseTopicTask(topic);
      return;
    }
    await this.createCloseTopicTask(topic);
  }

  private async hasPendingCloseTopicTask(customerId: string): Promise<boolean> {
    const existingCloseTopicTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      type: TaskProcess.CLOSE_TOPIC,
      status: 'pending'
    });
    return existingCloseTopicTasks.length > 0;
  }

  private async createCloseTopicTask(topic: TopicDTO): Promise<void> {
    const scheduledTime = new Date();
    const task = this.createCloseTopicTaskProcess(topic, scheduledTime);
    await this.taskProcessRepository.save(task);
    this.logger.info(`Scheduled close topic task for customer ${topic.customerId}`, {
      topicId: topic.id,
      customerId: topic.customerId,
      scheduledTime: scheduledTime.toISOString(),
      taskType: TaskProcess.CLOSE_TOPIC
    });
  }

  private createCloseTopicTaskProcess(topic: TopicDTO, scheduledTime: Date): TaskProcess {
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

  private logSkippedCloseTopicTask(topic: TopicDTO): void {
    this.logger.info(`Skipped creating close topic task for customer ${topic.customerId} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId
    });
  }
}


