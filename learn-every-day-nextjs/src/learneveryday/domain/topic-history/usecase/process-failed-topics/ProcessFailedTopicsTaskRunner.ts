import { TaskProcess } from "../../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../../taskprocess/ports/TaskProcessRunner";
import { LoggerPort } from "../../../shared/ports/LoggerPort";
import { GetStuckTasksProcessor } from "./GetStuckTasksProcessor";
import { FilterReprocessableTasksProcessor } from "./processor/FilterReprocessableTasksProcessor";
import { ReprocessStuckTasksProcessor } from "./ReprocessStuckTasksProcessor";

export class ProcessFailedTopicsTaskRunner implements TaskProcessRunner {
  constructor(
    private readonly getStuckTasksFeature: GetStuckTasksProcessor,
    private readonly filterReprocessableTasksFeature: FilterReprocessableTasksProcessor,
    private readonly reprocessStuckTasksFeature: ReprocessStuckTasksProcessor,
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

      const stuckTasks = await this.getStuckTasksFeature.execute(taskProcess.customerId);
      const reprocessableTasks = this.filterReprocessableTasksFeature.execute(stuckTasks);
      
      if (reprocessableTasks.length > 0) {
        await this.reprocessStuckTasksFeature.execute(reprocessableTasks);
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