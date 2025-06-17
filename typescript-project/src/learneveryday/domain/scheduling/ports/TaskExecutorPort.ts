import { ScheduledTask } from '../entities/ScheduledTask';

export interface TaskExecutorPort {
  /**
   * Executes a scheduled task
   * @param task The scheduled task to execute
   * @returns Promise<void> Resolves when task execution is completed
   * @throws Error if task execution fails
   */
  execute(task: ScheduledTask): Promise<void>;

  /**
   * Checks if the executor can handle a specific task type
   * @param taskType The type of task to check
   * @returns boolean True if the executor can handle this task type
   */
  canHandle(taskType: string): boolean;
} 