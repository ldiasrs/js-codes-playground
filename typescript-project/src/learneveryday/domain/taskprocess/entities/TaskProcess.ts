import { v4 as uuidv4 } from 'uuid';

export type TaskProcessType = 'topic-history-generation' | 'topic-history-send' | 'regenerate-topic-history';

export type TaskProcessStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export class TaskProcess {
  public readonly id: string;
  public readonly entityId: string;
  public readonly customerId: string;
  public readonly type: TaskProcessType;
  public readonly status: TaskProcessStatus;
  public readonly errorMsg?: string;
  public readonly scheduledTo?: Date;
  public readonly processAt?: Date;
  public readonly createdAt: Date;

  constructor(
    entityId: string,
    customerId: string,
    type: TaskProcessType,
    status: TaskProcessStatus = 'pending',
    id?: string,
    errorMsg?: string,
    scheduledTo?: Date,
    processAt?: Date,
    createdAt?: Date
  ) {
    this.id = id || uuidv4();
    this.entityId = entityId;
    this.customerId = customerId;
    this.type = type;
    this.status = status;
    this.errorMsg = errorMsg;
    this.scheduledTo = scheduledTo;
    this.processAt = processAt;
    this.createdAt = createdAt || new Date();
  }

  /**
   * Updates the status of the task process
   * @param status The new status
   * @param errorMsg Optional error message for failed status
   * @returns A new TaskProcess instance with updated status
   */
  updateStatus(status: TaskProcessStatus, errorMsg?: string): TaskProcess {
    return new TaskProcess(
      this.entityId,
      this.customerId,
      this.type,
      status,
      this.id,
      errorMsg,
      this.scheduledTo,
      this.processAt,
      this.createdAt
    );
  }

  /**
   * Sets the processAt timestamp when the task starts running
   * @returns A new TaskProcess instance with processAt set
   */
  startProcessing(): TaskProcess {
    return new TaskProcess(
      this.entityId,
      this.customerId,
      this.type,
      'running',
      this.id,
      this.errorMsg,
      this.scheduledTo,
      new Date(),
      this.createdAt
    );
  }
} 