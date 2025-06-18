import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import { TasksProcessExecutor } from '../../domain/taskprocess/usecase/TasksProcessExecutor';
import { GenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/SendTopicHistoryTaskRunner';
import { TYPES } from '../di/types';

@injectable()
export class TriggerTaskProcessExecutorCron {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(
    @inject(TYPES.TasksProcessExecutor) private readonly tasksProcessExecutor: TasksProcessExecutor,
    @inject(TYPES.GenerateTopicHistoryTaskRunner) private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    @inject(TYPES.SendTopicHistoryTaskRunner) private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner
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
   * 1. Generate topic histories
   * 2. Send topic histories
   */
  private async executeTaskProcessing(): Promise<void> {
    if (this.isRunning) {
      console.log('Task processing is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log('🚀 Starting scheduled task processing workflow');

      // Step 1: Generate topic histories
      console.log('📝 Step 1: Generating topic histories...');
      await this.tasksProcessExecutor.execute(
        { processType: 'topic-history-generation', limit: 10 },
        this.generateTopicHistoryTaskRunner
      );
      console.log('✅ Topic history generation completed');

      // Step 2: Send topic histories
      console.log('📧 Step 2: Sending topic histories...');
      await this.tasksProcessExecutor.execute(
        { processType: 'topic-history-send', limit: 10 },
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
   * Executes the task processing workflow for a specific customer
   * 1. Generate topic histories for the customer
   * 2. Send topic histories for the customer
   * @param customerId The customer ID to process tasks for
   */
  async executeTaskProcessingForCustomer(customerId: string): Promise<void> {
    if (this.isRunning) {
      console.log('Task processing is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log(`🚀 Starting task processing workflow for customer: ${customerId}`);

      // Step 1: Generate topic histories for the customer
      console.log(`📝 Step 1: Generating topic histories for customer: ${customerId}...`);
      await this.tasksProcessExecutor.execute(
        { processType: 'topic-history-generation', limit: 10 },
        this.generateTopicHistoryTaskRunner
      );
      console.log(`✅ Topic history generation completed for customer: ${customerId}`);

      // Step 2: Send topic histories for the customer
      console.log(`📧 Step 2: Sending topic histories for customer: ${customerId}...`);
      await this.tasksProcessExecutor.execute(
        { processType: 'topic-history-send', limit: 10 },
        this.sendTopicHistoryTaskRunner
      );
      console.log(`✅ Topic history sending completed for customer: ${customerId}`);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`🎉 Task processing workflow completed for customer: ${customerId} in ${duration}ms`);

    } catch (error) {
      console.error(`❌ Error during task processing workflow for customer: ${customerId}:`, error);
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