import { SQLLogRepository } from '../repositories/SQLLogRepository';
import { LoggerPort } from '../../../shared/ports/LoggerPort';

/**
 * Process that cleans old logs from the database
 * Removes logs older than 1 month to prevent database growth
 */
export class CleanOldLogsProcess {
  private static readonly DAYS_TO_KEEP_LOGS = 30;
  private static readonly MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

  constructor(
    private readonly logRepository: SQLLogRepository,
    private readonly logger: LoggerPort
  ) {}

  async execute(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logProcessStart();
      
      const cutoffDate = this.calculateCutoffDate();
      const deletedCount = await this.deleteOldLogs(cutoffDate);
      
      this.logProcessCompletion(deletedCount, startTime);
    } catch (error) {
      this.logProcessError(error);
      throw error;
    }
  }

  /**
   * Calculates the cutoff date for log deletion (1 month ago)
   * @returns Date The cutoff date - logs older than this will be deleted
   */
  private calculateCutoffDate(): Date {
    const now = new Date();
    const cutoffTime = now.getTime() - (CleanOldLogsProcess.DAYS_TO_KEEP_LOGS * CleanOldLogsProcess.MILLISECONDS_PER_DAY);
    return new Date(cutoffTime);
  }

  /**
   * Deletes logs older than the specified cutoff date
   * @param cutoffDate The date before which logs should be deleted
   * @returns Promise<number> The number of logs deleted
   */
  private async deleteOldLogs(cutoffDate: Date): Promise<number> {
    this.logger.info(`Deleting logs older than ${cutoffDate.toISOString()}`, {
      cutoffDate: cutoffDate.toISOString(),
      daysToKeep: CleanOldLogsProcess.DAYS_TO_KEEP_LOGS
    });

    return await this.logRepository.deleteOldLogs(cutoffDate);
  }

  /**
   * Logs the start of the cleanup process
   * @param taskId The ID of the task that triggered this process
   */
  private logProcessStart(): void {
    this.logger.info('Starting CleanOldLogsProcess execution', {
      process: 'clean-old-logs',
      daysToKeep: CleanOldLogsProcess.DAYS_TO_KEEP_LOGS
    });
  }

  /**
   * Logs the successful completion of the cleanup process
   * @param deletedCount Number of logs that were deleted
   * @param startTime Start time of the process
   */
  private logProcessCompletion(deletedCount: number, startTime: number): void {
    const executionTime = Date.now() - startTime;
    
    this.logger.info('CleanOldLogsProcess completed successfully', {
      process: 'clean-old-logs',
      deletedLogsCount: deletedCount,
      executionTimeMs: executionTime,
      daysKept: CleanOldLogsProcess.DAYS_TO_KEEP_LOGS
    });
  }

  /**
   * Logs errors that occur during the cleanup process
   * @param error The error that occurred
   */
  private logProcessError(error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    this.logger.error('CleanOldLogsProcess failed', errorObj, {
      process: 'clean-old-logs',
      daysToKeep: CleanOldLogsProcess.DAYS_TO_KEEP_LOGS
    });
  }
} 