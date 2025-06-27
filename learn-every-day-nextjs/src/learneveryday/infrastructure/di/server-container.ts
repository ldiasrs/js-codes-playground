import { NextJSContainer } from './nextjs-container';
import { TriggerTaskProcessExecutorCron } from '../scheduler/TriggerTaskProcessExecutorCron';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';

export class ServerContainer extends NextJSContainer {
  private cronScheduler: TriggerTaskProcessExecutorCron | null = null;

  constructor() {
    super();
    this.initializeServerServices();
    this.startCronScheduler();
  }

  private initializeServerServices(): void {
    // Register server-side only services
    this.registerSingleton('TriggerTaskProcessExecutorCron', () => new TriggerTaskProcessExecutorCron(
      this.get('TasksProcessExecutor'),
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('SendTopicHistoryTaskRunner'),
      this.get('ReGenerateTopicHistoryTaskRunner'),
      this.get('Logger')
    ));
  }

  private startCronScheduler(): void {
    try {
      this.cronScheduler = this.get<TriggerTaskProcessExecutorCron>('TriggerTaskProcessExecutorCron');
      
      // Start the cron scheduler with default schedule (every hour)
      this.cronScheduler.start();
      
      const logger = this.get<LoggerPort>('Logger');
      logger.info('🚀 Cron scheduler started successfully');
    } catch (error) {
      const logger = this.get<LoggerPort>('Logger');
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('❌ Failed to start cron scheduler:', errorObj);
    }
  }

  /**
   * Stops the cron scheduler
   * Useful for graceful shutdown
   */
  stopCronScheduler(): void {
    if (this.cronScheduler) {
      this.cronScheduler.stop();
      const logger = this.get<LoggerPort>('Logger');
      logger.info('🛑 Cron scheduler stopped');
    }
  }

  /**
   * Gets the cron scheduler instance
   */
  getCronScheduler(): TriggerTaskProcessExecutorCron | null {
    return this.cronScheduler;
  }
}

export class ServerContainerBuilder {
  private static container: ServerContainer;

  public static build(): ServerContainer {
    if (!this.container) {
      this.container = new ServerContainer();
    }
    return this.container;
  }

  public static reset(): void {
    if (this.container) {
      // Stop cron scheduler before resetting
      this.container.stopCronScheduler();
      this.container.reset();
      this.container = null as unknown as ServerContainer;
    }
  }

  /**
   * Gracefully shuts down the server container
   */
  public static shutdown(): void {
    if (this.container) {
      this.container.stopCronScheduler();
      this.container = null as unknown as ServerContainer;
    }
  }
} 