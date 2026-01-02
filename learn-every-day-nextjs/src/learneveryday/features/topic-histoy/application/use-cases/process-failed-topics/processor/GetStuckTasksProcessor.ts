import { LoggerPort } from "../../../../../../shared/ports/LoggerPort";
import { TaskProcessRepositoryPort } from "../../../../../taskprocess/application/ports/TaskProcessRepositoryPort";
import { TaskProcess } from "../../../../../taskprocess/domain/TaskProcess";

/**
 * Retrieves all stuck tasks (failed or running) for a customer.
 */
export class GetStuckTasksProcessor {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Get failed and running (stuck) tasks for a customer.
   */
  async execute(customerId: string): Promise<TaskProcess[]> {
    try {
      const customerTasks = await this.taskProcessRepository.findByCustomerId(customerId);
      const failedTasks = customerTasks.filter(task => task.status === 'failed');
      const runningTasks = customerTasks.filter(task => task.status === 'running');
      const allStuckTasks = [...failedTasks, ...runningTasks];
      this.logger.info(
        `Found ${allStuckTasks.length} stuck tasks for customer (${failedTasks.length} failed, ${runningTasks.length} running)`,
        {
          customerId,
          failedTasksCount: failedTasks.length,
          runningTasksCount: runningTasks.length,
          totalStuckTasksCount: allStuckTasks.length
        }
      );
      return allStuckTasks;
    } catch (error) {
      this.logger.error(
        'Error retrieving stuck tasks',
        error instanceof Error ? error : new Error(String(error)),
        { customerId }
      );
      return [];
    }
  }
}


