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
   * Executes the failed topics processing task
   * @param taskProcess The task process that triggered this execution
   * @returns Promise<void> Resolves when failed tasks are processed
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

      const failedTasks = await this.getFailedTasks();
      const reprocessableTasks = this.filterReprocessableTasks(failedTasks);
      
      if (reprocessableTasks.length > 0) {
        await this.reprocessFailedTasks(reprocessableTasks);
      } else {
        this.logger.info("No failed tasks found for reprocessing", {
          customerId: "not-provided"
        });
      }

      this.logExecutionCompletion(startTime, reprocessableTasks.length);
    } catch (error) {
      this.logger.error("Failed to execute ProcessFailedTopicsTaskRunner", 
        error instanceof Error ? error : new Error(String(error)), {
          customerId: "not-provided"
        });
      throw error;
    }
  }

  /**
   * Retrieves all failed tasks from the repository
   * @returns Promise<TaskProcess[]> Array of failed task processes
   */
  private async getFailedTasks(): Promise<TaskProcess[]> {
    try {
      const failedTasks = await this.taskProcessRepository.findFailedTasks();
      this.logger.info(`Found ${failedTasks.length} failed tasks`, {
        customerId: "not-provided",
        failedTasksCount: failedTasks.length
      });
      return failedTasks;
    } catch (error) {
      this.logger.error("Error retrieving failed tasks", 
        error instanceof Error ? error : new Error(String(error)), {
          customerId: "not-provided"
        });
      return [];
    }
  }

  /**
   * Filters failed tasks to only include those with reprocessable error messages
   * @param failedTasks Array of failed task processes
   * @returns TaskProcess[] Array of tasks that can be reprocessed
   */
  private filterReprocessableTasks(failedTasks: TaskProcess[]): TaskProcess[] {
    const reprocessableTasks = failedTasks.filter(task => 
      this.isErrorReprocessable(task.errorMsg)
    );

    this.logger.info(`Found ${reprocessableTasks.length} reprocessable tasks out of ${failedTasks.length} failed tasks`, {
      customerId: "not-provided",
      totalFailedTasks: failedTasks.length,
      reprocessableTasksCount: reprocessableTasks.length,
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
   * Reprocesses failed tasks by updating their status to pending
   * @param reprocessableTasks Array of tasks to reprocess
   */
  private async reprocessFailedTasks(reprocessableTasks: TaskProcess[]): Promise<void> {
    let successfullyReprocessed = 0;
    let failedToReprocess = 0;

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
          customerId: task.customerId
        });
      }
    }

    this.logReprocessingResults(reprocessableTasks.length, successfullyReprocessed, failedToReprocess);
  }

  /**
   * Reprocesses a single failed task by updating its status to pending
   * @param task The task to reprocess
   */
  private async reprocessSingleTask(task: TaskProcess): Promise<void> {
    const reprocessedTask = task.updateStatus('pending');
    await this.taskProcessRepository.save(reprocessedTask);

    this.logger.info(`Reprocessed failed task ${task.id}`, {
      taskId: task.id,
      taskType: task.type,
      customerId: task.customerId,
      originalError: task.errorMsg,
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
   */
  private logReprocessingResults(totalReprocessable: number, successful: number, failed: number): void {
    this.logger.info("Reprocessing completed", {
      customerId: "not-provided",
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
   */
  private logExecutionCompletion(startTime: number, reprocessedCount: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info("ProcessFailedTopicsTaskRunner completed", {
      customerId: "not-provided",
      executionTimeMs: totalExecutionTime,
      reprocessedTasksCount: reprocessedCount
    });
  }
} 