import { LoggerPort } from "@/learneveryday/shared";
import { FindTopicsWithoutTasksService } from "./service/FindTopicsWithoutTasksService";
import { ScheduleGenerationTasksService } from "./service/ScheduleGenerationTasksService";

/**
 * Orchestrates the scheduling of GENERATE_TOPIC_HISTORY tasks for topics
 * that were created in the last 48h but don't have generation tasks yet.
 */
export class ScheduleMissingGenerationTasksRunner {
  constructor(
    private readonly findTopicsWithoutTasksService: FindTopicsWithoutTasksService,
    private readonly scheduleGenerationTasksService: ScheduleGenerationTasksService,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the scheduling of missing generation tasks.
   * @returns Promise<void> Resolves when scheduling is complete
   */
  async execute(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting schedule missing generation tasks', {
        customerId: 'not-provided'
      });

      const eligibleTopics = await this.findTopicsWithoutTasksService.execute();
      const scheduledCount = await this.scheduleGenerationTasksService.execute(eligibleTopics);

      this.logExecutionCompletion(startTime, eligibleTopics.length, scheduledCount);
    } catch (error) {
      this.logger.error(
        'Failed to execute schedule missing generation tasks',
        error instanceof Error ? error : new Error(String(error)),
        { customerId: 'not-provided' }
      );
      throw error;
    }
  }

  /**
   * Logs the completion of the scheduling process
   * @param startTime The start time of the execution
   * @param eligibleTopicsCount Total number of eligible topics found
   * @param scheduledCount Number of successfully scheduled tasks
   */
  private logExecutionCompletion(startTime: number, eligibleTopicsCount: number, scheduledCount: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info('Schedule missing generation tasks completed', {
      customerId: 'not-provided',
      executionTimeMs: totalExecutionTime,
      eligibleTopicsFound: eligibleTopicsCount,
      tasksScheduled: scheduledCount
    });
  }
}

