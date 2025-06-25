import * as cron from 'node-cron';
import { TasksProcessExecutor } from '../../domain/taskprocess/usecase/TasksProcessExecutor';
import { GenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/ReGenerateTopicHistoryTaskRunner';
import { TaskProcess } from '../../domain/taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';

export class TriggerTaskProcessExecutorCron {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(
    private readonly tasksProcessExecutor: TasksProcessExecutor,
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly scheduleGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Starts the cron job that runs every hour
   * @param cronExpression Optional cron expression (default: '0 * * * *' - every hour)
   */
  start(cronExpression: string = '0 * * * *'): void {
    if (this.cronJob) {
      this.logger.warn('Cron job is already running');
      return;
    }

    this.logger.info(`Starting TriggerTaskProcessExecutorCron with schedule: ${cronExpression}`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.executeTaskProcessing();
    }, {
      timezone: 'UTC'
    });

    this.logger.info('TriggerTaskProcessExecutorCron started successfully');
  }

  /**
   * Stops the cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.logger.info('TriggerTaskProcessExecutorCron stopped');
    }
  }


  /**
   * Executes the task processing workflow for all customers
   * 1. Schedule topic history generation
   * 2. Generate topic histories
   * 3. Send topic histories
   */
  async executeTaskProcessing(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Task processing is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      this.logger.info('🚀 Starting task processing workflow for all customers');

      // Step 1: Schedule topic history generation
      this.logger.info('📅 Step 1: Scheduling topic history generation...');
      await this.tasksProcessExecutor.execute(
        { processType: TaskProcess.REGENERATE_TOPIC_HISTORY, limit: 10 },
        this.scheduleGenerateTopicHistoryTaskRunner
      );
      this.logger.info('✅ Topic history scheduling completed');

      // Step 2: Generate topic histories
      this.logger.info('📝 Step 2: Generating topic histories...');
      await this.tasksProcessExecutor.execute(
        { processType: TaskProcess.GENERATE_TOPIC_HISTORY, limit: 10 },
        this.generateTopicHistoryTaskRunner
      );

      this.logger.info('✅ Topic history generation completed');

      // Step 3: Send topic histories
      this.logger.info('📧 Step 3: Sending topic histories...');
      await this.tasksProcessExecutor.execute(
        { processType: TaskProcess.SEND_TOPIC_HISTORY, limit: 10 },
        this.sendTopicHistoryTaskRunner
      );
      this.logger.info('✅ Topic history sending completed');

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.logger.info(`🎉 Task processing workflow completed in ${duration}ms`, { duration });

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