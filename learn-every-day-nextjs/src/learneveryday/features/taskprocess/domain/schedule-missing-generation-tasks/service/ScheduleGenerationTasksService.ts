import { LoggerPort } from "@/learneveryday/shared";
import { TaskProcessRepositoryPort } from "../../../ports/TaskProcessRepositoryPort";
import { TaskProcess } from "../../api/TaskProcess";
import { Topic } from "@/learneveryday/features/topic/domain/Topic";

/**
 * Schedules GENERATE_TOPIC_HISTORY tasks for topics.
 * Tasks are scheduled immediately (no delay).
 */
export class ScheduleGenerationTasksService {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Schedules GENERATE_TOPIC_HISTORY tasks for the given topics.
   * @param topics Array of topics to schedule tasks for
   * @returns Promise<number> Number of successfully scheduled tasks
   */
  async execute(topics: Topic[]): Promise<number> {
    if (topics.length === 0) {
      this.logger.info('No topics to schedule generation tasks for', {
        customerId: 'not-provided'
      });
      return 0;
    }

    const startTime = Date.now();
    let scheduledCount = 0;
    let failedCount = 0;

    this.logger.info(`Starting scheduling of generation tasks for ${topics.length} topics`, {
      customerId: 'not-provided',
      topicsCount: topics.length
    });

    for (const topic of topics) {
      try {
        const task = this.createGenerationTask(topic);
        await this.taskProcessRepository.save(task);
        scheduledCount++;
        this.logger.debug(`Scheduled generation task for topic ${topic.id}`, {
          topicId: topic.id,
          customerId: topic.customerId,
          taskId: task.id
        });
      } catch (error) {
        failedCount++;
        this.logger.error(
          `Error scheduling generation task for topic ${topic.id}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            topicId: topic.id,
            customerId: topic.customerId
          }
        );
      }
    }

    this.logger.info(`Completed scheduling of generation tasks`, {
      customerId: 'not-provided',
      totalTopics: topics.length,
      scheduledCount,
      failedCount,
      executionTimeMs: Date.now() - startTime
    });

    return scheduledCount;
  }

  /**
   * Creates a GENERATE_TOPIC_HISTORY task for a topic.
   * Task is scheduled immediately (no scheduledTo delay).
   * @param topic The topic to create a task for
   * @returns TaskProcess The created task
   */
  private createGenerationTask(topic: Topic): TaskProcess {
    const now = new Date();
    const scheduledTo = new Date(now.getTime() + 1000);
    return new TaskProcess(
      topic.id,
      topic.customerId,
      TaskProcess.GENERATE_TOPIC_HISTORY,
      'pending',
      undefined,
      undefined,
      scheduledTo,
      undefined,
      now
    );
  }
}

