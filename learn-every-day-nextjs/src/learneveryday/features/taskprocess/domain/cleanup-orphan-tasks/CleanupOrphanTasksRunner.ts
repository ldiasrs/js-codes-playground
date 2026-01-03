import { LoggerPort } from "@/learneveryday/shared";
import { FindOrphanTasksService } from "./service/FindOrphanTasksService";
import { DeleteOrphanTasksService } from "./service/DeleteOrphanTasksService";

/**
 * Orchestrates the cleanup of orphan tasks.
 * Finds tasks that reference deleted topics or topic histories and deletes them.
 */
export class CleanupOrphanTasksRunner {
  constructor(
    private readonly findOrphanTasksService: FindOrphanTasksService,
    private readonly deleteOrphanTasksService: DeleteOrphanTasksService,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the orphan tasks cleanup process.
   * @returns Promise<void> Resolves when cleanup is complete
   */
  async execute(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting orphan tasks cleanup', {
        customerId: 'not-provided'
      });

      const orphanTasks = await this.findOrphanTasksService.execute();
      const deletedCount = await this.deleteOrphanTasksService.execute(orphanTasks);

      this.logExecutionCompletion(startTime, orphanTasks.length, deletedCount);
    } catch (error) {
      this.logger.error(
        'Failed to execute orphan tasks cleanup',
        error instanceof Error ? error : new Error(String(error)),
        { customerId: 'not-provided' }
      );
      throw error;
    }
  }

  /**
   * Logs the completion of the cleanup process
   * @param startTime The start time of the execution
   * @param orphanTasksCount Total number of orphan tasks found
   * @param deletedCount Number of successfully deleted tasks
   */
  private logExecutionCompletion(startTime: number, orphanTasksCount: number, deletedCount: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info('Orphan tasks cleanup completed', {
      customerId: 'not-provided',
      executionTimeMs: totalExecutionTime,
      orphanTasksFound: orphanTasksCount,
      orphanTasksDeleted: deletedCount
    });
  }
}

