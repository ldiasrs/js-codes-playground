import { TaskProcess } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../taskprocess/ports/TaskProcessRunner";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { LoggerPort } from "../../shared/ports/LoggerPort";

export class ProcessFailedTopicsTaskRunner implements TaskProcessRunner {
  private static readonly ALLOW_REPROCESS_ERRORS = [
    "The model is overloaded. Please try again later.",
  ];

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the failed and stuck topics processing task
   * @param taskProcess The task process that triggered this execution
   * @returns Promise<void> Resolves when failed and stuck tasks are processed
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info("Starting ProcessFailedTopicsTaskRunner", {
        triggeredBy: {
          taskId: taskProcess.id,
          customerId: taskProcess.customerId,
          type: taskProcess.type
        }
      });

      const stuckTasks = await this.getStuckTasks(taskProcess.customerId);
      const reprocessableTasks = this.filterReprocessableTasks(stuckTasks);
      
      if (reprocessableTasks.length > 0) {
        await this.reprocessStuckTasks(reprocessableTasks);
      } else {
        this.logger.info("No stuck tasks found for reprocessing", {
          customerId: taskProcess.customerId
        });
      }

      this.logExecutionCompletion(startTime, reprocessableTasks.length, taskProcess.customerId);
    } catch (error) {
      this.logger.error("Failed to execute ProcessFailedTopicsTaskRunner", 
        error instanceof Error ? error : new Error(String(error)), {
          customerId: taskProcess.customerId
        });
      throw error;
    }
  }

  /**
   * Retrieves all stuck tasks (both failed and running) for a specific customer
   * @param customerId The customer ID to filter tasks for
   * @returns Promise<TaskProcess[]> Array of stuck task processes for the customer
   */
  private async getStuckTasks(customerId: string): Promise<TaskProcess[]> {
    try {
      const customerTasks = await this.taskProcessRepository.findByCustomerId(customerId);
      
      const failedTasks = customerTasks.filter(task => task.status === 'failed');
      const runningTasks = customerTasks.filter(task => task.status === 'running');
      const allStuckTasks = [...failedTasks, ...runningTasks];
      
      this.logger.info(`Found ${allStuckTasks.length} stuck tasks for customer (${failedTasks.length} failed, ${runningTasks.length} running)`, {
        customerId,
        failedTasksCount: failedTasks.length,
        runningTasksCount: runningTasks.length,
        totalStuckTasksCount: allStuckTasks.length
      });
      
      return allStuckTasks;
    } catch (error) {
      this.logger.error("Error retrieving stuck tasks", 
        error instanceof Error ? error : new Error(String(error)), {
          customerId
        });
      return [];
    }
  }

  /**
   * Filters stuck tasks to only include those that can be reprocessed
   * - Failed tasks: only those with reprocessable error messages
   * - Running tasks: all running tasks (assumed to be stuck)
   * @param stuckTasks Array of stuck task processes
   * @param customerId The customer ID for logging purposes
   * @returns TaskProcess[] Array of tasks that can be reprocessed
   */
  private filterReprocessableTasks(stuckTasks: TaskProcess[]): TaskProcess[] {
    const reprocessableTasks = stuckTasks.filter(task => {
      // Running tasks are always considered reprocessable (assumed stuck)
      if (task.status === 'running') {
        return true;
      }
      // Failed tasks only if they have reprocessable errors
      if (task.status === 'failed') {
        return this.isErrorReprocessable(task.errorMsg);
      }
      return false;
    });

    const failedReprocessable = reprocessableTasks.filter(t => t.status === 'failed').length;
    const runningReprocessable = reprocessableTasks.filter(t => t.status === 'running').length;

    this.logger.info(`Found ${reprocessableTasks.length} reprocessable tasks out of ${stuckTasks.length} stuck tasks`, {
      customerId: reprocessableTasks[0]?.customerId,
      totalStuckTasks: stuckTasks.length,
      reprocessableTasksCount: reprocessableTasks.length,
      failedReprocessableCount: failedReprocessable,
      runningReprocessableCount: runningReprocessable,
      reprocessableTaskTypes: this.getTaskTypesCount(reprocessableTasks)
    });

    return reprocessableTasks;
  }

  /**
   * Checks if an error message is in the allow reprocess list
   * @param errorMsg The error message to check
   * @returns boolean True if the error can be reprocessed
   */
  private isErrorReprocessable(errorMsg?: string): boolean {
    if (!errorMsg) {
      return false;
    }

    return ProcessFailedTopicsTaskRunner.ALLOW_REPROCESS_ERRORS.some(allowedError =>
      errorMsg.includes(allowedError)
    );
  }

  /**
   * Reprocesses stuck tasks by updating their status to pending
   * @param reprocessableTasks Array of tasks to reprocess
   * @param customerId The customer ID for logging purposes
   */
  private async reprocessStuckTasks(reprocessableTasks: TaskProcess[]): Promise<void> {
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

    this.logReprocessingResults(reprocessableTasks.length, successfullyReprocessed, failedToReprocess, customerId);
  }

  /**
   * Reprocesses a single stuck task by updating its status to pending
   * @param task The task to reprocess
   */
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

  /**
   * Gets a count of tasks by type for logging purposes
   * @param tasks Array of task processes
   * @returns Record<string, number> Count of tasks by type
   */
  private getTaskTypesCount(tasks: TaskProcess[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Logs the results of the reprocessing operation
   * @param totalReprocessable Total number of reprocessable tasks
   * @param successful Number of successfully reprocessed tasks
   * @param failed Number of tasks that failed to reprocess
   * @param customerId The customer ID for logging purposes
   */
  private logReprocessingResults(totalReprocessable: number, successful: number, failed: number, customerId: string): void {
    this.logger.info("Reprocessing completed", {
      customerId,
      totalReprocessable,
      successfullyReprocessed: successful,
      failedToReprocess: failed,
      successRate: totalReprocessable > 0 ? (successful / totalReprocessable * 100).toFixed(2) + '%' : '0%'
    });
  }

  /**
   * Logs the completion of the execution
   * @param startTime The start time of the execution
   * @param reprocessedCount Number of tasks that were reprocessed
   * @param customerId The customer ID for logging purposes
   */
  private logExecutionCompletion(startTime: number, reprocessedCount: number, customerId: string): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info("ProcessFailedTopicsTaskRunner completed", {
      customerId,
      executionTimeMs: totalExecutionTime,
      reprocessedTasksCount: reprocessedCount
    });
  }
} 