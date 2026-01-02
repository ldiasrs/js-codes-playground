import { LoggerPort } from "../../../../../../shared/ports/LoggerPort";
import { TaskProcess } from "../../../../domain/TaskProcess";

/**
 * Filters stuck tasks to find which ones are eligible for reprocessing.
 */
export class FilterReprocessableTasksProcessor {
  private static readonly ALLOW_REPROCESS_ERRORS: ReadonlyArray<string> = [
    'The model is overloaded. Please try again later.',
  ] as const;

  constructor(private readonly logger: LoggerPort) {}

  execute(stuckTasks: TaskProcess[]): TaskProcess[] {
    const reprocessableTasks = stuckTasks.filter(task => {
      if (task.status === 'running') {
        return true;
      }
      if (task.status === 'failed') {
        return this.isErrorReprocessable(task.errorMsg);
      }
      return false;
    });

    const failedReprocessable = reprocessableTasks.filter(t => t.status === 'failed').length;
    const runningReprocessable = reprocessableTasks.filter(t => t.status === 'running').length;

    this.logger.info(`Found ${reprocessableTasks.length} reprocessable tasks out of ${stuckTasks.length} stuck tasks`, {
      customerId: reprocessableTasks[0]?.customerId,
      totalStuckTasks: stuckTasks.length,
      reprocessableTasksCount: reprocessableTasks.length,
      failedReprocessableCount: failedReprocessable,
      runningReprocessableCount: runningReprocessable,
      reprocessableTaskTypes: this.getTaskTypesCount(reprocessableTasks)
    });

    return reprocessableTasks;
  }

  private isErrorReprocessable(errorMsg?: string): boolean {
    if (!errorMsg) {
      return false;
    }
    return FilterReprocessableTasksProcessor.ALLOW_REPROCESS_ERRORS.some(msg => errorMsg.includes(msg));
  }

  private getTaskTypesCount(tasks: TaskProcess[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}


