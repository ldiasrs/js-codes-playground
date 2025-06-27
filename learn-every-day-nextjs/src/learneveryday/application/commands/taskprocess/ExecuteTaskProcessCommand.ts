import { BaseCommand } from '../Command';
import { TaskProcessType } from '../../../domain/taskprocess/entities/TaskProcess';
import { TaskProcessRunner } from '../../../domain/taskprocess/ports/TaskProcessRunner';
import { TaskProcessRepositoryPort } from '../../../domain/taskprocess/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../../domain/shared/ports/LoggerPort';

export interface ExecuteTaskProcessCommandData {
  processType: TaskProcessType;
  limit?: number;
}

export class ExecuteTaskProcessCommand extends BaseCommand<void, ExecuteTaskProcessCommandData> {
  private runner: TaskProcessRunner | null = null;

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    super();
  }

  setRunner(runner: TaskProcessRunner): void {
    this.runner = runner;
  }

  async execute(data: ExecuteTaskProcessCommandData): Promise<void> {
    if (!this.runner) {
      throw new Error('TaskProcessRunner not set. Call setRunner() before executing the command.');
    }

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

        // Execute the task using the provided runner
        await this.runner.execute(runningTask);

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