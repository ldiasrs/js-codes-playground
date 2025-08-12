import { TaskProcess } from "../../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../../taskprocess/ports/TaskProcessRunner";
import { LoggerPort } from "../../../shared/ports/LoggerPort";
import { CheckAndCloseTopicsWithManyHistoriesFeature } from "./CheckAndCloseTopicsWithManyHistoriesFeature";
import { RemoveTasksFromClosedTopicsFeature } from "./RemoveTasksFromClosedTopicsFeature";

export class CloseTopicsTaskRunner implements TaskProcessRunner {
  constructor(
    private readonly checkAndCloseTopicsFeature: CheckAndCloseTopicsWithManyHistoriesFeature,
    private readonly removeTasksFromClosedTopicsFeature: RemoveTasksFromClosedTopicsFeature,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Executes the close topics task for a specific customer
   * @param taskProcess The task process containing the customer ID
   * @returns Promise<void> Resolves when topics are checked and closed as needed
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const startTime = Date.now();
    const customerId = taskProcess.customerId;

    try {
      this.logger.info(`Starting CloseTopicsTaskRunner for customer ${customerId}`, {
        customerId: customerId
      });

      // Step 1: Check and close topics with many histories
      await this.checkAndCloseTopicsFeature.execute(customerId);

      // Step 2: Clean up tasks from closed topics
      await this.removeTasksFromClosedTopicsFeature.execute(customerId);

      this.logExecutionCompletion(customerId, startTime);
    } catch (error) {      
      this.handleExecuteError(customerId, error);
      throw error;
    }
  }
  private handleExecuteError(customerId: string, error: unknown): void {
    this.logger.error(`Failed to execute CloseTopicsTaskRunner for customer ${customerId}`,
      error instanceof Error ? error : new Error(String(error)));
  }
  

  private logExecutionCompletion(customerId: string, startTime: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info(`CloseTopicsTaskRunner completed for customer ${customerId}`, {
      customerId,
      executionTimeMs: totalExecutionTime,
    });
  }
} 