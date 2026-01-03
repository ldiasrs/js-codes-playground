import { TaskProcess } from './TaskProcess';

export interface TaskProcessRunner {
  /**
   * Executes the task process
   * @param taskProcess The task process to execute
   * @returns Promise<void> Resolves when the task is completed successfully
   * @throws Error if the task fails
   */
  execute(taskProcess: TaskProcess): Promise<void>;
} 