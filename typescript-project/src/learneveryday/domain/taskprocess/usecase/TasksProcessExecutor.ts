import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TaskProcess, TaskProcessType } from '../entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../ports/TaskProcessRepositoryPort';
import { TaskProcessRunner } from '../ports/TaskProcessRunner';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TYPES } from '../../../infrastructure/di/types';

export interface TasksProcessExecutorData {
  processType: TaskProcessType;
  limit?: number;
}

@injectable()
export class TasksProcessExecutor {
  constructor(
    @inject(TYPES.TaskProcessRepository) private readonly taskProcessRepository: TaskProcessRepositoryPort,
    @inject(TYPES.Logger) private readonly logger: LoggerPort
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
      this.logger.info(`No pending tasks found for process type: ${processType}`);
      return;
    }

    this.logger.info(`Found ${pendingTasks.length} pending tasks for process type: ${processType}`, {
      processType,
      taskCount: pendingTasks.length,
      limit
    });

    // Step 2: Group tasks by customerId for sequential processing per customer
    const tasksByCustomer = this.groupTasksByCustomer(pendingTasks);
    
    this.logger.info(`Grouped tasks into ${tasksByCustomer.size} customer groups`, {
      processType,
      customerGroups: tasksByCustomer.size,
      totalTasks: pendingTasks.length
    });

    // Step 3: Process each customer group sequentially, but different customers in parallel
    const customerProcessingPromises = Array.from(tasksByCustomer.entries()).map(
      ([customerId, tasks]) => this.processCustomerTasks(customerId, tasks, runner)
    );
    
    // Step 4: Wait for all customer groups to complete
    await Promise.allSettled(customerProcessingPromises);
  }

  /**
   * Groups tasks by customerId
   * @param tasks Array of tasks to group
   * @returns Map of customerId to array of tasks
   */
  private groupTasksByCustomer(tasks: TaskProcess[]): Map<string, TaskProcess[]> {
    const tasksByCustomer = new Map<string, TaskProcess[]>();
    
    for (const task of tasks) {
      if (!tasksByCustomer.has(task.customerId)) {
        tasksByCustomer.set(task.customerId, []);
      }
      tasksByCustomer.get(task.customerId)!.push(task);
    }
    
    return tasksByCustomer;
  }

  /**
   * Processes all tasks for a specific customer sequentially
   * @param customerId The customer ID
   * @param tasks Array of tasks for this customer
   * @param runner The task process runner
   * @returns Promise<void> Resolves when all tasks for this customer are processed
   */
  private async processCustomerTasks(
    customerId: string, 
    tasks: TaskProcess[], 
    runner: TaskProcessRunner
  ): Promise<void> {
    this.logger.info(`Processing ${tasks.length} tasks sequentially for customer: ${customerId}`, {
      customerId,
      taskCount: tasks.length,
      taskTypes: tasks.map(t => t.type)
    });
    
    // Process tasks for this customer sequentially
    for (const task of tasks) {
      await this.processTask(task, runner);
    }
    
    this.logger.info(`✅ Completed processing all tasks for customer: ${customerId}`, {
      customerId,
      taskCount: tasks.length
    });
  }

  /**
   * Processes a single task process
   * @param taskProcess The task process to execute
   * @param runner The task process runner
   * @returns Promise<void> Resolves when the task is processed
   */
  private async processTask(taskProcess: TaskProcess, runner: TaskProcessRunner): Promise<void> {
    try {
      this.logger.info(`Starting task process: ${taskProcess.id} (${taskProcess.type})`, {
        taskId: taskProcess.id,
        taskType: taskProcess.type,
        customerId: taskProcess.customerId,
        entityId: taskProcess.entityId
      });

      // Step 1: Update status to running and save
      const runningTask = taskProcess.startProcessing();
      await this.taskProcessRepository.save(runningTask);

      // Step 2: Execute the task using the runner
      await runner.execute(runningTask);

      // Step 3: Update status to completed and save
      const completedTask = runningTask.updateStatus('completed');
      await this.taskProcessRepository.save(completedTask);

      this.logger.info(`✅ Task process completed: ${taskProcess.id} (${taskProcess.type})`, {
        taskId: taskProcess.id,
        taskType: taskProcess.type,
        customerId: taskProcess.customerId
      });

    } catch (error) {
      this.logger.error(`❌ Task process failed: ${taskProcess.id} (${taskProcess.type})`, error as Error, {
        taskId: taskProcess.id,
        taskType: taskProcess.type,
        customerId: taskProcess.customerId,
        entityId: taskProcess.entityId
      });

      // Step 4: Update status to failed with error message and save
      const errorMessage = error instanceof Error ? error.message : String(error);
      const failedTask = taskProcess.updateStatus('failed', errorMessage);
      await this.taskProcessRepository.save(failedTask);
    }
  }
} 