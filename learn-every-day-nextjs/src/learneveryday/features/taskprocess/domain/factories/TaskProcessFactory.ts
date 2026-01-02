import { TaskProcess, TaskProcessStatus } from '../TaskProcess';

const TASK_STATUS_PENDING: TaskProcessStatus = 'pending';

/**
 * Factory for creating TaskProcess instances.
 * Encapsulates the creation logic for different types of task processes.
 */
export class TaskProcessFactory {
  /**
   * Creates a task process for topic history generation.
   * @param topicId The topic ID (used as entityId)
   * @param customerId The customer ID
   * @returns TaskProcess A new task process instance
   */
  static createTopicHistoryGenerationTask(
    topicId: string,
    customerId: string
  ): TaskProcess {
    return new TaskProcess(
      topicId,
      customerId,
      TaskProcess.GENERATE_TOPIC_HISTORY,
      TASK_STATUS_PENDING,
      undefined,
      undefined,
      undefined,
      undefined,
      new Date()
    );
  }
}

