import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TaskProcess, TaskProcessType } from '../entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../ports/TaskProcessRepositoryPort';
import { TaskProcessRunner } from '../ports/TaskProcessRunner';
import { TYPES } from '../../../infrastructure/di/types';

export interface TasksProcessExecutorData {
  processType: TaskProcessType;
  limit?: number;
}

@injectable()
export class TasksProcessExecutor {
  constructor(
    @inject(TYPES.TaskProcessRepository) private readonly taskProcessRepository: TaskProcessRepositoryPort
  ) {}

  /**
   * Executes pending tasks of a specific process type
   * @param data The data containing process type and optional limit
   * @param runner The task process runner to execute the tasks
   * @returns Promise<void> Resolves when all tasks are processed
   */
  async execute(data: TasksProcessExecutorData, runner: TaskProcessRunner): Promise<void> {
    const { processType, limit = 10 } = data;

    // Step 1: Fetch pending tasks of the specified type
    const pendingTasks = await this.taskProcessRepository.findPendingTaskProcessByStatusAndType(
      'pending',
      processType,
      limit
    );

    if (pendingTasks.length === 0) {
      console.log(`No pending tasks found for process type: ${processType}`);
      return;
    }

    console.log(`Found ${pendingTasks.length} pending tasks for process type: ${processType}`);

    // Step 2: Process each task
    const processingPromises = pendingTasks.map(taskProcess => this.processTask(taskProcess, runner));
    
    // Step 3: Wait for all tasks to complete
    await Promise.allSettled(processingPromises);
  }

  /**
   * Processes a single task process
   * @param taskProcess The task process to execute
   * @param runner The task process runner
   * @returns Promise<void> Resolves when the task is processed
   */
  private async processTask(taskProcess: TaskProcess, runner: TaskProcessRunner): Promise<void> {
    try {
      console.log(`Starting task process: ${taskProcess.id} (${taskProcess.type})`);

      // Step 1: Update status to running and save
      const runningTask = taskProcess.startProcessing();
      await this.taskProcessRepository.save(runningTask);

      // Step 2: Execute the task using the runner
      await runner.execute(runningTask);

      // Step 3: Update status to completed and save
      const completedTask = runningTask.updateStatus('completed');
      await this.taskProcessRepository.save(completedTask);

      console.log(`✅ Task process completed: ${taskProcess.id} (${taskProcess.type})`);

    } catch (error) {
      console.error(`❌ Task process failed: ${taskProcess.id} (${taskProcess.type})`, error);

      // Step 4: Update status to failed with error message and save
      const errorMessage = error instanceof Error ? error.message : String(error);
      const failedTask = taskProcess.updateStatus('failed', errorMessage);
      await this.taskProcessRepository.save(failedTask);
    }
  }
} 