import { LoggerPort } from "@/learneveryday/shared";
import { TopicRepositoryPort } from "@/learneveryday/features/topic/application/ports/TopicRepositoryPort";
import { Topic } from "@/learneveryday/features/topic/domain/Topic";

/**
 * Finds topics created in the last 48h that don't have GENERATE_TOPIC_HISTORY tasks and aren't closed.
 * Uses SQL queries with filters to efficiently identify eligible topics directly in the database.
 */
export class FindTopicsWithoutTasksService {
  private static readonly HOURS_48 = 48;

  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Finds topics created in the last 48h that don't have GENERATE_TOPIC_HISTORY tasks and aren't closed.
   * Uses SQL queries with filters to efficiently identify eligible topics directly in the database.
   * @returns Promise<Topic[]> Array of eligible topics
   */
  async execute(): Promise<Topic[]> {
    const startTime = Date.now();

    try {
      this.logger.info('Finding topics created in last 48h without generation tasks using SQL filters', {
        customerId: 'not-provided',
        hoursAgo: FindTopicsWithoutTasksService.HOURS_48
      });

      const eligibleTopics = await this.topicRepository.findTopicsWithoutGenerationTasks(
        FindTopicsWithoutTasksService.HOURS_48
      );

      this.logger.info(`Found ${eligibleTopics.length} topics without generation tasks`, {
        customerId: 'not-provided',
        eligibleTopicsCount: eligibleTopics.length,
        executionTimeMs: Date.now() - startTime
      });

      return eligibleTopics;
    } catch (error) {
      this.logger.error(
        'Error finding topics without tasks',
        error instanceof Error ? error : new Error(String(error)),
        { customerId: 'not-provided' }
      );
      return [];
    }
  }
}

