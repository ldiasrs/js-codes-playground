import { TaskProcessType } from '../entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../ports/TaskProcessRepositoryPort';
import { TaskProcessRunner } from '../ports/TaskProcessRunner';
import { LoggerPort } from '../../shared/ports/LoggerPort';

export interface TasksProcessExecutorData {
  processType: TaskProcessType;
  limit?: number;
}

export class TasksProcessExecutor {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes task processes of a specific type
   * @param data The data containing processType and optional limit
   * @param runner The task runner to use for execution
   * @returns Promise<void> Resolves when all tasks are processed
   * @throws Error if task processing fails
   */
  async execute(data: TasksProcessExecutorData, runner: TaskProcessRunner): Promise<void> {
    const { processType, limit = 10 } = data;

    this.logger.info(`Starting task process execution for type: ${processType}`, {
      processType,
      limit
    });

    // Get pending tasks of the specified type
    const pendingTasks = await this.taskProcessRepository.findPendingTaskProcessByStatusAndType('pending', processType, limit);

    if (pendingTasks.length === 0) {
      this.logger.info(`No pending tasks found for type: ${processType}`);
      return;
    }

    this.logger.info(`Found ${pendingTasks.length} pending tasks to process`, {
      processType,
      taskCount: pendingTasks.length
    });

    // Process each task
    for (const task of pendingTasks) {
      try {
        // Mark task as running
        const runningTask = task.startProcessing();
        await this.taskProcessRepository.save(runningTask);

        // Execute the task
        await runner.execute(runningTask);

        // Mark task as completed
        const completedTask = runningTask.updateStatus('completed');
        await this.taskProcessRepository.save(completedTask);

        this.logger.info(`Successfully processed task: ${task.id}`, {
          taskId: task.id,
          processType: task.type,
          customerId: task.customerId
        });

      } catch (error) {
        // Mark task as failed
        const errorMessage = error instanceof Error ? error.message : String(error);
        const failedTask = task.updateStatus('failed', errorMessage);
        await this.taskProcessRepository.save(failedTask);

        const errorObj = error instanceof Error ? error : new Error(errorMessage);
        this.logger.error(`Failed to process task: ${task.id}`, errorObj, {
          taskId: task.id,
          processType: task.type,
          customerId: task.customerId
        });
      }
    }

    this.logger.info(`Completed task process execution for type: ${processType}`, {
      processType,
      processedTasks: pendingTasks.length
    });
  }
} 