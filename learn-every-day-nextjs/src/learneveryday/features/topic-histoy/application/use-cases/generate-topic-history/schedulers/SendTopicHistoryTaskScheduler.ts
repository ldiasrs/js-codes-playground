import { TaskProcess } from '../../../../taskprocess/entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../../../../taskprocess/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { Topic } from '../../../../../features/topic/domain/Topic';
import { TopicHistory } from '../../../entities/TopicHistory';

/**
 * Schedules SEND_TOPIC_HISTORY tasks when needed.
 */
export class SendTopicHistoryTaskScheduler {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Schedule a send task for the given topic history if there is no pending one.
   */
  async scheduleIfNeeded(newHistory: TopicHistory, topic: Topic): Promise<void> {
    const hasPendingSendTask = await this.hasPendingSendTask(newHistory.id);
    if (hasPendingSendTask) {
      this.logSkippedSendTask(newHistory, topic);
      return;
    }
    await this.createSendTask(newHistory, topic);
  }

  private async hasPendingSendTask(topicHistoryId: string): Promise<boolean> {
    const existingSendTasks = await this.taskProcessRepository.searchProcessedTasks({
      entityId: topicHistoryId,
      type: TaskProcess.SEND_TOPIC_HISTORY,
      status: 'pending'
    });
    return existingSendTasks.length > 0;
  }

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

  private calculateSendScheduledTime(): Date {
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes());
    return scheduledTime;
  }

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

  private logSkippedSendTask(newHistory: TopicHistory, topic: Topic): void {
    this.logger.info(`Skipped creating send topic history task for history ${newHistory.id} - pending task already exists`, {
      topicId: topic.id,
      customerId: topic.customerId,
      historyId: newHistory.id
    });
  }
}


