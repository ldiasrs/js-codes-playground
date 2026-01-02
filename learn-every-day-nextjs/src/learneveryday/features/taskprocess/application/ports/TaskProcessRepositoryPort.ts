import { TaskProcess, TaskProcessType, TaskProcessStatus } from '../../domain/TaskProcess';

export interface TaskProcessSearchCriteria {
  entityId?: string;
  customerId?: string;
  type?: TaskProcessType;
  status?: TaskProcessStatus;
  dateFrom?: Date;
  dateTo?: Date;
  scheduledTo?: Date;
  processAt?: Date;
}

export interface TaskProcessRepositoryPort {
  save(taskProcess: TaskProcess): Promise<TaskProcess>;
  findById(id: string): Promise<TaskProcess | undefined>;
  findAll(): Promise<TaskProcess[]>;
  findByEntityId(entityId: string): Promise<TaskProcess[]>;
  findByCustomerId(customerId: string): Promise<TaskProcess[]>;
  findByType(type: TaskProcessType): Promise<TaskProcess[]>;
  findByStatus(status: TaskProcessStatus): Promise<TaskProcess[]>;
  findByEntityIdAndType(entityId: string, type: TaskProcessType): Promise<TaskProcess[]>;
  findPendingTasks(): Promise<TaskProcess[]>;
  findRunningTasks(): Promise<TaskProcess[]>;
  findScheduledTasks(): Promise<TaskProcess[]>;
  findFailedTasks(): Promise<TaskProcess[]>;
  findPendingTaskProcessByStatusAndType(status: TaskProcessStatus, type: TaskProcessType, limit?: number): Promise<TaskProcess[]>;
  searchProcessedTasks(criteria: TaskProcessSearchCriteria): Promise<TaskProcess[]>;
  delete(id: string): Promise<boolean>;
  deleteByEntityId(entityId: string): Promise<void>;
  deleteByCustomerId(customerId: string): Promise<void>;
  count(): Promise<number>;
  countByStatus(status: TaskProcessStatus): Promise<number>;
  countByType(type: TaskProcessType): Promise<number>;
  getTasksCreatedToday(): Promise<TaskProcess[]>;
  getTasksCreatedThisWeek(): Promise<TaskProcess[]>;
  getTasksCreatedThisMonth(): Promise<TaskProcess[]>;
  getTasksScheduledForDate(date: Date): Promise<TaskProcess[]>;
  getTasksScheduledForDateRange(dateFrom: Date, dateTo: Date): Promise<TaskProcess[]>;
} 