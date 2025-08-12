import { TaskProcess } from '../../../taskprocess/entities/TaskProcess';
import { TaskProcessRepositoryPort } from '../../../taskprocess/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../../shared/ports/LoggerPort';

export interface TaskAnalysis {
  allTasks: TaskProcess[];
  generateTasks: TaskProcess[];
  pendingTasksCount: number;
  lastSendTask: TaskProcess | null;
}

/**
 * Loads tasks and builds an analysis memo for the re-generation decision process.
 */
export class AnalyzeTasksFeature {
  private static readonly HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(customerId: string): Promise<TaskAnalysis> {
    const twentyFourHoursAgo = new Date(Date.now() - AnalyzeTasksFeature.HOURS_24_IN_MS);
    const allTasks = await this.getTasksFromLast24Hours(customerId, twentyFourHoursAgo);
    const generateTasks = allTasks.filter(task => task.type === TaskProcess.GENERATE_TOPIC_HISTORY);
    const pendingTasksCount = generateTasks.filter(task => task.status === 'pending').length;
    const lastSendTask = this.findLastSendTask(allTasks);

    this.logger.info(`Found ${generateTasks.length} generate tasks for customer ${customerId} in the last 24h`, {
      customerId,
      taskCount: generateTasks.length
    });
    this.logger.info(`Found ${pendingTasksCount} pending tasks for customer ${customerId} in the last 24h`, {
      customerId,
      taskCount: pendingTasksCount
    });

    return { allTasks, generateTasks, pendingTasksCount, lastSendTask };
  }

  private async getTasksFromLast24Hours(customerId: string, dateFrom: Date): Promise<TaskProcess[]> {
    const tasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      dateFrom,
    });
    this.logger.info(`Found ${tasks.length} tasks for customer ${customerId} in the last 24h`, {
      customerId,
      dateFrom,
      taskCount: tasks.length
    });
    return tasks || [];
  }

  private findLastSendTask(allTasks: TaskProcess[]): TaskProcess | null {
    const sendTasks = allTasks.filter(task => task.type === TaskProcess.SEND_TOPIC_HISTORY);
    if (sendTasks.length === 0) return null;
    return sendTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
}


