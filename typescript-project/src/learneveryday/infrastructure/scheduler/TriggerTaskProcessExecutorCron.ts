import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import { TasksProcessExecutor } from '../../domain/taskprocess/usecase/TasksProcessExecutor';
import { GenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/ReGenerateTopicHistoryTaskRunner';
import { TYPES } from '../di/types';
import { TaskProcess } from '../../domain/taskprocess/entities/TaskProcess';

@injectable()
export class TriggerTaskProcessExecutorCron {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(
    @inject(TYPES.TasksProcessExecutor) private readonly tasksProcessExecutor: TasksProcessExecutor,
    @inject(TYPES.GenerateTopicHistoryTaskRunner) private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    @inject(TYPES.SendTopicHistoryTaskRunner) private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    @inject(TYPES.ScheduleGenerateTopicHistoryTaskRunner) private readonly scheduleGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner
  ) {}

  /**
   * Starts the cron job that runs every hour
   * @param cronExpression Optional cron expression (default: '0 * * * *' - every hour)
   */
  start(cronExpression: string = '0 * * * *'): void {
    if (this.cronJob) {
      console.log('Cron job is already running');
      return;
    }

    console.log(`Starting TriggerTaskProcessExecutorCron with schedule: ${cronExpression}`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.executeTaskProcessing();
    }, {
      timezone: 'UTC'
    });

    console.log('TriggerTaskProcessExecutorCron started successfully');
  }

  /**
   * Stops the cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('TriggerTaskProcessExecutorCron stopped');
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
      console.log('Task processing is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log('🚀 Starting task processing workflow for all customers');

      // Step 1: Schedule topic history generation
      console.log('📅 Step 1: Scheduling topic history generation...');
      await this.tasksProcessExecutor.execute(
        { processType: TaskProcess.REGENERATE_TOPIC_HISTORY, limit: 10 },
        this.scheduleGenerateTopicHistoryTaskRunner
      );
      console.log('✅ Topic history scheduling completed');

      // Step 2: Generate topic histories
      console.log('📝 Step 2: Generating topic histories...');
      await this.tasksProcessExecutor.execute(
        { processType: TaskProcess.GENERATE_TOPIC_HISTORY, limit: 10 },
        this.generateTopicHistoryTaskRunner
      );
      console.log('✅ Topic history generation completed');

      // Step 3: Send topic histories
      console.log('📧 Step 3: Sending topic histories...');
      await this.tasksProcessExecutor.execute(
        { processType: TaskProcess.SEND_TOPIC_HISTOY, limit: 10 },
        this.sendTopicHistoryTaskRunner
      );
      console.log('✅ Topic history sending completed');

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`🎉 Task processing workflow completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Error during task processing workflow:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually triggers the task processing workflow
   * Useful for testing or immediate execution
   */
  async triggerNow(): Promise<void> {
    console.log('🔄 Manually triggering task processing workflow');
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