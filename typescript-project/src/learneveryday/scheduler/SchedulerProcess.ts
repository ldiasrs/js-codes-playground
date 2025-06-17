import { SchedulingService } from '../domain/scheduling/services/SchedulingService';
import { ScheduledTask, TaskType } from '../domain/scheduling/entities/ScheduledTask';
import { SchedulingServiceFactory } from '../infrastructure/factories/SchedulingServiceFactory';

export class SchedulerProcess {
  private schedulingService: SchedulingService;
  private isRunning: boolean = false;

  constructor(dataDir: string = './data') {
    this.schedulingService = SchedulingServiceFactory.create(dataDir);
  }

  /**
   * Starts the scheduler process
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Scheduler process is already running');
      return;
    }

    console.log('🚀 Starting scheduler process...');
    
    try {
      await this.schedulingService.start();
      this.isRunning = true;
      
      console.log('✅ Scheduler process started successfully');
      console.log('📊 Service status:', this.schedulingService.getStatus());
      
      // Keep the process running
      this.keepAlive();
      
    } catch (error) {
      console.error('❌ Failed to start scheduler process:', error);
      throw error;
    }
  }

  /**
   * Stops the scheduler process
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler process is not running');
      return;
    }

    console.log('🛑 Stopping scheduler process...');
    
    this.schedulingService.stop();
    this.isRunning = false;
    
    console.log('✅ Scheduler process stopped successfully');
  }

  /**
   * Schedules a new task
   * @param taskType The type of task to schedule
   * @param cronExpression The cron expression for scheduling
   * @param taskData Additional data for the task
   */
  async scheduleTask(taskType: TaskType, cronExpression: string, taskData: any = {}): Promise<void> {
    const task = new ScheduledTask(taskType, taskData, cronExpression);
    await this.schedulingService.scheduleTask(task);
  }

  /**
   * Removes a scheduled task
   * @param taskId The ID of the task to remove
   */
  async removeTask(taskId: string): Promise<void> {
    await this.schedulingService.removeTask(taskId);
  }

  /**
   * Gets the status of the scheduler
   */
  getStatus(): { isRunning: boolean; serviceStatus: any } {
    return {
      isRunning: this.isRunning,
      serviceStatus: this.schedulingService.getStatus()
    };
  }

  /**
   * Keeps the process alive
   */
  private keepAlive(): void {
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      this.stop();
      process.exit(0);
    });

    // Log status every 5 minutes
    setInterval(() => {
      if (this.isRunning) {
        const status = this.getStatus();
        console.log('📊 Scheduler status:', status);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
} 