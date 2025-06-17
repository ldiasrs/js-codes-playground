import { v4 as uuidv4 } from 'uuid';

export type TaskType = 'SendLastTopicHistory' | 'GenerateTopicHistory' | 'SendEmail';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskData {
  [key: string]: any;
}

export class ScheduledTask {
  public readonly id: string;
  public readonly taskType: TaskType;
  public readonly taskData: TaskData;
  public readonly cronExpression: string;
  public readonly status: TaskStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly lastRunAt?: Date;
  public readonly nextRunAt?: Date;
  public readonly errorMessage?: string;
  public readonly isActive: boolean;

  constructor(
    taskType: TaskType,
    taskData: TaskData,
    cronExpression: string,
    id?: string,
    status: TaskStatus = 'pending',
    createdAt?: Date,
    updatedAt?: Date,
    lastRunAt?: Date,
    nextRunAt?: Date,
    errorMessage?: string,
    isActive: boolean = true
  ) {
    this.id = id || uuidv4();
    this.taskType = taskType;
    this.taskData = taskData;
    this.cronExpression = cronExpression;
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.lastRunAt = lastRunAt;
    this.nextRunAt = nextRunAt;
    this.errorMessage = errorMessage;
    this.isActive = isActive;
  }

  public markAsRunning(): ScheduledTask {
    return new ScheduledTask(
      this.taskType,
      this.taskData,
      this.cronExpression,
      this.id,
      'running',
      this.createdAt,
      new Date(),
      this.lastRunAt,
      this.nextRunAt,
      this.errorMessage,
      this.isActive
    );
  }

  public markAsCompleted(): ScheduledTask {
    return new ScheduledTask(
      this.taskType,
      this.taskData,
      this.cronExpression,
      this.id,
      'completed',
      this.createdAt,
      new Date(),
      new Date(),
      this.nextRunAt,
      undefined,
      this.isActive
    );
  }

  public markAsFailed(errorMessage: string): ScheduledTask {
    return new ScheduledTask(
      this.taskType,
      this.taskData,
      this.cronExpression,
      this.id,
      'failed',
      this.createdAt,
      new Date(),
      this.lastRunAt,
      this.nextRunAt,
      errorMessage,
      this.isActive
    );
  }

  public updateNextRun(nextRunAt: Date): ScheduledTask {
    return new ScheduledTask(
      this.taskType,
      this.taskData,
      this.cronExpression,
      this.id,
      this.status,
      this.createdAt,
      new Date(),
      this.lastRunAt,
      nextRunAt,
      this.errorMessage,
      this.isActive
    );
  }

  public deactivate(): ScheduledTask {
    return new ScheduledTask(
      this.taskType,
      this.taskData,
      this.cronExpression,
      this.id,
      this.status,
      this.createdAt,
      new Date(),
      this.lastRunAt,
      this.nextRunAt,
      this.errorMessage,
      false
    );
  }

  public activate(): ScheduledTask {
    return new ScheduledTask(
      this.taskType,
      this.taskData,
      this.cronExpression,
      this.id,
      this.status,
      this.createdAt,
      new Date(),
      this.lastRunAt,
      this.nextRunAt,
      this.errorMessage,
      true
    );
  }
} 