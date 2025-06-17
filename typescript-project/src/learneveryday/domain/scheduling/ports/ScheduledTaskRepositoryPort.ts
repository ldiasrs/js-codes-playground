import { ScheduledTask, TaskType, TaskStatus } from '../entities/ScheduledTask';

export interface ScheduledTaskSearchCriteria {
  taskType?: TaskType;
  status?: TaskStatus;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  hasNextRunBefore?: Date;
}

export interface ScheduledTaskRepositoryPort {
  save(scheduledTask: ScheduledTask): Promise<ScheduledTask>;
  findById(id: string): Promise<ScheduledTask | undefined>;
  findAll(): Promise<ScheduledTask[]>;
  findByTaskType(taskType: TaskType): Promise<ScheduledTask[]>;
  findByStatus(status: TaskStatus): Promise<ScheduledTask[]>;
  findActive(): Promise<ScheduledTask[]>;
  findPendingTasks(): Promise<ScheduledTask[]>;
  findTasksToRun(beforeDate: Date): Promise<ScheduledTask[]>;
  search(criteria: ScheduledTaskSearchCriteria): Promise<ScheduledTask[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  getTasksCreatedToday(): Promise<ScheduledTask[]>;
  getTasksCreatedThisWeek(): Promise<ScheduledTask[]>;
  getTasksCreatedThisMonth(): Promise<ScheduledTask[]>;
  getFailedTasks(): Promise<ScheduledTask[]>;
  getCompletedTasks(): Promise<ScheduledTask[]>;
} 