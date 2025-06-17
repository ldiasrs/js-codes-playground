import * as cron from 'node-cron';
import { ScheduledTaskRepositoryPort } from '../ports/ScheduledTaskRepositoryPort';
import { TaskExecutorPort } from '../ports/TaskExecutorPort';
import { ScheduledTask } from '../entities/ScheduledTask';

export class SchedulingService {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private taskExecutors: Map<string, TaskExecutorPort> = new Map();
  private isRunning: boolean = false;

  constructor(
    private readonly scheduledTaskRepository: ScheduledTaskRepositoryPort
  ) {}

  /**
   * Registers a task executor for a specific task type
   * @param taskType The type of task this executor can handle
   * @param executor The task executor implementation
   */
  registerTaskExecutor(taskType: string, executor: TaskExecutorPort): void {
    this.taskExecutors.set(taskType, executor);
    console.log(`✅ Registered task executor for type: ${taskType}`);
  }

  /**
   * Starts the scheduling service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Scheduling service is already running');
      return;
    }

    console.log('🚀 Starting scheduling service...');
    this.isRunning = true;

    // Load existing scheduled tasks
    await this.loadScheduledTasks();

    // Start the hourly check for new tasks
    this.startHourlyCheck();

    console.log('✅ Scheduling service started successfully');
  }

  /**
   * Stops the scheduling service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Scheduling service is not running');
      return;
    }

    console.log('🛑 Stopping scheduling service...');

    // Stop all cron jobs
    this.cronJobs.forEach((job, taskId) => {
      job.stop();
      console.log(`⏹️ Stopped cron job for task: ${taskId}`);
    });

    this.cronJobs.clear();
    this.isRunning = false;

    console.log('✅ Scheduling service stopped successfully');
  }

  /**
   * Schedules a new task
   * @param task The scheduled task to add
   */
  async scheduleTask(task: ScheduledTask): Promise<void> {
    try {
      // Save the task to the repository
      const savedTask = await this.scheduledTaskRepository.save(task);

      // Create and start the cron job
      this.createCronJob(savedTask);

      console.log(`✅ Scheduled task ${task.id} with cron expression: ${task.cronExpression}`);
    } catch (error) {
      console.error(`❌ Failed to schedule task ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * Removes a scheduled task
   * @param taskId The ID of the task to remove
   */
  async removeTask(taskId: string): Promise<void> {
    try {
      // Stop the cron job
      const cronJob = this.cronJobs.get(taskId);
      if (cronJob) {
        cronJob.stop();
        this.cronJobs.delete(taskId);
        console.log(`⏹️ Stopped cron job for task: ${taskId}`);
      }

      // Remove from repository
      await this.scheduledTaskRepository.delete(taskId);

      console.log(`✅ Removed task: ${taskId}`);
    } catch (error) {
      console.error(`❌ Failed to remove task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Loads all active scheduled tasks from the repository
   */
  private async loadScheduledTasks(): Promise<void> {
    try {
      const activeTasks = await this.scheduledTaskRepository.findActive();
      
      console.log(`📋 Loading ${activeTasks.length} active scheduled tasks...`);

      for (const task of activeTasks) {
        this.createCronJob(task);
      }

      console.log(`✅ Loaded ${activeTasks.length} scheduled tasks`);
    } catch (error) {
      console.error('❌ Failed to load scheduled tasks:', error);
      throw error;
    }
  }

  /**
   * Creates a cron job for a scheduled task
   * @param task The scheduled task
   */
  private createCronJob(task: ScheduledTask): void {
    // Stop existing job if it exists
    const existingJob = this.cronJobs.get(task.id);
    if (existingJob) {
      existingJob.stop();
    }

    // Create new cron job
    const cronJob = cron.schedule(task.cronExpression, async () => {
      await this.executeTask(task);
    });

    // Store the cron job
    this.cronJobs.set(task.id, cronJob);

    // Start the job
    cronJob.start();

    console.log(`⏰ Created cron job for task ${task.id} with expression: ${task.cronExpression}`);
  }

  /**
   * Executes a scheduled task
   * @param task The task to execute
   */
  async executeTask(task: ScheduledTask): Promise<void> {
    try {
      console.log(`🎯 Executing task: ${task.id} (${task.taskType})`);

      // Mark task as running
      const runningTask = task.markAsRunning();
      await this.scheduledTaskRepository.save(runningTask);

      // Find the appropriate executor
      const executor = this.taskExecutors.get(task.taskType);
      if (!executor) {
        throw new Error(`No executor found for task type: ${task.taskType}`);
      }

      // Execute the task
      await executor.execute(task);

      // Mark task as completed
      const completedTask = task.markAsCompleted();
      await this.scheduledTaskRepository.save(completedTask);

      console.log(`✅ Task ${task.id} completed successfully`);

    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error);

      // Mark task as failed
      const failedTask = task.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
      await this.scheduledTaskRepository.save(failedTask);
    }
  }

  /**
   * Starts the hourly check for new tasks
   */
  private startHourlyCheck(): void {
    // Run every hour at minute 0
    const hourlyJob = cron.schedule('0 * * * *', async () => {
      console.log('🕐 Hourly check for scheduled tasks...');
      await this.checkForNewTasks();
    });

    hourlyJob.start();
    console.log('⏰ Started hourly check for scheduled tasks');
  }

  /**
   * Checks for new tasks that need to be scheduled
   */
  private async checkForNewTasks(): Promise<void> {
    try {
      // Get all active tasks that don't have a cron job yet
      const activeTasks = await this.scheduledTaskRepository.findActive();
      
      for (const task of activeTasks) {
        if (!this.cronJobs.has(task.id)) {
          console.log(`🆕 Found new task to schedule: ${task.id}`);
          this.createCronJob(task);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for new tasks:', error);
    }
  }

  /**
   * Gets the status of the scheduling service
   */
  getStatus(): { isRunning: boolean; activeJobs: number; registeredExecutors: number } {
    return {
      isRunning: this.isRunning,
      activeJobs: this.cronJobs.size,
      registeredExecutors: this.taskExecutors.size
    };
  }
} 