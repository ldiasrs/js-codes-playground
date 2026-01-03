import { LoggerPort } from "../../../../../shared/ports/LoggerPort";
import { TaskProcessRepositoryPort } from "../../../ports/TaskProcessRepositoryPort";
import { TaskProcess } from "../../TaskProcess";

/**
 * Reprocess stuck tasks by setting them back to pending.
 */
export class ReprocessStuckTasksService {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(reprocessableTasks: TaskProcess[]): Promise<void> {
    let successfullyReprocessed = 0;
    let failedToReprocess = 0;
    const customerId = reprocessableTasks[0]?.customerId;

    for (const task of reprocessableTasks) {
      try {
        await this.reprocessSingleTask(task);
        successfullyReprocessed++;
      } catch (error) {
        failedToReprocess++;
        this.logger.error(`Failed to reprocess task ${task.id}`,
          error instanceof Error ? error : new Error(String(error)), {
          taskId: task.id,
          taskType: task.type,
          customerId: task.customerId,
          originalStatus: task.status
        });
      }
    }

    this.logger.info('Reprocessing completed', {
      customerId,
      totalReprocessable: reprocessableTasks.length,
      successfullyReprocessed,
      failedToReprocess,
      successRate: reprocessableTasks.length > 0 ? (successfullyReprocessed / reprocessableTasks.length * 100).toFixed(2) + '%' : '0%'
    });
  }

  private async reprocessSingleTask(task: TaskProcess): Promise<void> {
    const reprocessedTask = task.updateStatus('pending');
    await this.taskProcessRepository.save(reprocessedTask);
    this.logger.info(`Reprocessed stuck task ${task.id}`, {
      taskId: task.id,
      taskType: task.type,
      customerId: task.customerId,
      originalStatus: task.status,
      originalError: task.errorMsg || 'No error (was running)',
      newStatus: 'pending'
    });
  }
}


