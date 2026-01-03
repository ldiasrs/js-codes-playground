import { TaskProcessRepositoryPort } from "@/learneveryday/features/taskprocess/ports/TaskProcessRepositoryPort";
import { TaskProcess } from "@/learneveryday/features/taskprocess/domain/TaskProcess";
import { Topic } from "@/learneveryday/features/topic/domain/Topic";
import { LoggerPort } from "@/learneveryday/shared";

/**
 * Creates and saves GENERATE_TOPIC_HISTORY tasks for selected topics.
 */
export class ScheduleGenerateTasksBatchProcessor {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(topics: Topic[], customerId: string, scheduledTime: Date): Promise<void> {
    const tasks = topics.map(topic => this.createTask(topic, customerId, scheduledTime));
    for (const task of tasks) {
      try {
        await this.taskProcessRepository.save(task);
      } catch (error) {
        this.logger.error(
          `Failed to save task for topic ${task.entityId}`,
          error instanceof Error ? error : new Error(String(error)),
          { customerId: task.customerId, topicId: task.entityId }
        );
      }
    }
    this.logger.info(`Scheduled ${tasks.length} GENERATE_TOPIC_HISTORY tasks for customer ${customerId}`);
  }

  private createTask(topic: Topic, customerId: string, scheduledTime: Date): TaskProcess {
    this.logger.info(`Scheduling GENERATE_TOPIC_HISTORY task for topic ${topic.id} at ${scheduledTime}`, {
      customerId,
      topicId: topic.id
    });
    return new TaskProcess(
      topic.id,
      customerId,
      TaskProcess.GENERATE_TOPIC_HISTORY,
      'pending',
      undefined,
      undefined,
      scheduledTime,
      undefined
    );
  }
}


