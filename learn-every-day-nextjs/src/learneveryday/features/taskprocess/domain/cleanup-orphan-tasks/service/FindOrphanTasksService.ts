import { LoggerPort } from "@/learneveryday/shared";
import { TaskProcessRepositoryPort } from "../../../ports/TaskProcessRepositoryPort";
import { TaskProcess } from "../../api/TaskProcess";

/**
 * Finds all orphan tasks - tasks that reference deleted topics or topic histories.
 * Uses SQL queries with filters to efficiently identify orphan tasks directly in the database.
 */
export class FindOrphanTasksService {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Finds all orphan tasks using SQL queries with filters.
   * Orphan tasks are identified directly in the database using NOT EXISTS clauses.
   * @returns Promise<TaskProcess[]> Array of orphan tasks
   */
  async execute(): Promise<TaskProcess[]> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting orphan tasks detection using SQL filters', {
        customerId: 'not-provided'
      });

      const orphanTasks = await this.taskProcessRepository.findOrphanTasks();

      this.logger.info(`Found ${orphanTasks.length} orphan tasks`, {
        customerId: 'not-provided',
        orphanTasksCount: orphanTasks.length,
        executionTimeMs: Date.now() - startTime
      });

      return orphanTasks;
    } catch (error) {
      this.logger.error(
        'Error finding orphan tasks',
        error instanceof Error ? error : new Error(String(error)),
        { customerId: 'not-provided' }
      );
      return [];
    }
  }
}

