import { LoggerPort } from "@/learneveryday/shared";
import { TaskProcessRepositoryPort } from "../../../ports/TaskProcessRepositoryPort";
import { TaskProcess } from "../../api/TaskProcess";

/**
 * Deletes orphan tasks from the repository.
 * Handles errors gracefully, continuing deletion even if individual tasks fail.
 */
export class DeleteOrphanTasksService {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Deletes all orphan tasks from the repository.
   * @param orphanTasks Array of orphan tasks to delete
   * @returns Promise<number> Number of successfully deleted tasks
   */
  async execute(orphanTasks: TaskProcess[]): Promise<number> {
    if (orphanTasks.length === 0) {
      this.logger.info('No orphan tasks to delete', {
        customerId: 'not-provided'
      });
      return 0;
    }

    const startTime = Date.now();
    let deletedCount = 0;
    let failedCount = 0;

    this.logger.info(`Starting deletion of ${orphanTasks.length} orphan tasks`, {
      customerId: 'not-provided',
      orphanTasksCount: orphanTasks.length
    });

    for (const task of orphanTasks) {
      try {
        const deleted = await this.taskProcessRepository.delete(task.id);
        if (deleted) {
          deletedCount++;
          this.logger.debug(`Deleted orphan task ${task.id}`, {
            taskId: task.id,
            entityId: task.entityId,
            taskType: task.type,
            taskStatus: task.status
          });
        } else {
          failedCount++;
          this.logger.warn(`Failed to delete orphan task ${task.id} (repository returned false)`, {
            taskId: task.id,
            entityId: task.entityId,
            taskType: task.type
          });
        }
      } catch (error) {
        failedCount++;
        this.logger.error(
          `Error deleting orphan task ${task.id}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            taskId: task.id,
            entityId: task.entityId,
            taskType: task.type
          }
        );
      }
    }

    this.logger.info(`Completed deletion of orphan tasks`, {
      customerId: 'not-provided',
      totalOrphanTasks: orphanTasks.length,
      deletedCount,
      failedCount,
      executionTimeMs: Date.now() - startTime
    });

    return deletedCount;
  }
}

