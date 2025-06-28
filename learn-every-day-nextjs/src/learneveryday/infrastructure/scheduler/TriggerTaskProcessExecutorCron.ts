import * as cron from 'node-cron';
import { ProcessTopicHistoryWorkflowCommand } from '../../application/commands/topic-history/ProcessTopicHistoryWorkflowCommand';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';

export class TriggerTaskProcessExecutorCron {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(
    private readonly processTopicHistoryWorkflowCommand: ProcessTopicHistoryWorkflowCommand,
    private readonly logger: LoggerPort
  ) {}

  async executeTaskProcessing(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Task processing is already running, skipping this execution');
      return;
    }

    this.isRunning = true;

    try {
      await this.processTopicHistoryWorkflowCommand.execute({ limit: 10 });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('❌ Error during task processing workflow:', errorObj);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually triggers the task processing workflow
   * Useful for testing or immediate execution
   */
  async triggerNow(): Promise<void> {
    this.logger.info('🔄 Manually triggering task processing workflow');
    await this.executeTaskProcessing();
  }

  /**
   * Gets the current status of the cron job
   */
  getStatus(): { isRunning: boolean; hasCronJob: boolean } {
    return {
      isRunning: this.isRunning,
      hasCronJob: this.cronJob !== null
    };
  }
}