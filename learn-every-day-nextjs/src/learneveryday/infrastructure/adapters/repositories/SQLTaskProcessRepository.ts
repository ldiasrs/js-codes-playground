import { TaskProcess, TaskProcessType, TaskProcessStatus } from '../../../domain/taskprocess/entities/TaskProcess';
import { TaskProcessRepositoryPort, TaskProcessSearchCriteria } from '../../../domain/taskprocess/ports/TaskProcessRepositoryPort';
import { DatabaseManager } from '../../database/DatabaseManager';
import moment from 'moment';

interface TaskProcessData {
  id: string;
  entity_id: string;
  customer_id: string;
  type: TaskProcessType;
  status: TaskProcessStatus;
  error_msg?: string;
  scheduled_to?: string;
  process_at?: string;
  created_at: string;
}

export class SQLTaskProcessRepository implements TaskProcessRepositoryPort {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async save(taskProcess: TaskProcess): Promise<TaskProcess> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const taskProcessData: TaskProcessData = {
      id: taskProcess.id,
      entity_id: taskProcess.entityId,
      customer_id: taskProcess.customerId,
      type: taskProcess.type,
      status: taskProcess.status,
      error_msg: taskProcess.errorMsg,
      scheduled_to: taskProcess.scheduledTo?.toISOString(),
      process_at: taskProcess.processAt?.toISOString(),
      created_at: taskProcess.createdAt.toISOString()
    };

    await connection.query(
      `INSERT INTO task_processes 
       (id, entity_id, customer_id, type, status, error_msg, scheduled_to, process_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT(id) DO UPDATE SET
         entity_id = EXCLUDED.entity_id,
         customer_id = EXCLUDED.customer_id,
         type = EXCLUDED.type,
         status = EXCLUDED.status,
         error_msg = EXCLUDED.error_msg,
         scheduled_to = EXCLUDED.scheduled_to,
         process_at = EXCLUDED.process_at,
         created_at = EXCLUDED.created_at`,
      [
        taskProcessData.id,
        taskProcessData.entity_id,
        taskProcessData.customer_id,
        taskProcessData.type,
        taskProcessData.status,
        taskProcessData.error_msg,
        taskProcessData.scheduled_to,
        taskProcessData.process_at,
        taskProcessData.created_at
      ]
    );

    return taskProcess;
  }

  async findById(id: string): Promise<TaskProcess | undefined> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapToTaskProcess(result.rows[0] as unknown as TaskProcessData);
  }

  async findByEntityId(entityId: string): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE entity_id = $1 ORDER BY created_at DESC',
      [entityId]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async findByCustomerId(customerId: string): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async findByType(type: TaskProcessType): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE type = $1 ORDER BY created_at DESC',
      [type]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async findByStatus(status: TaskProcessStatus): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async findByEntityIdAndType(entityId: string, type: TaskProcessType): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE entity_id = $1 AND type = $2 ORDER BY created_at DESC',
      [entityId, type]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async findPendingTasks(): Promise<TaskProcess[]> {
    return this.findByStatus('pending');
  }

  async findRunningTasks(): Promise<TaskProcess[]> {
    return this.findByStatus('running');
  }

  async findScheduledTasks(): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    // Find tasks that have a scheduled_to date but are still pending
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE scheduled_to IS NOT NULL AND status = $1 ORDER BY scheduled_to ASC',
      ['pending']
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async findFailedTasks(): Promise<TaskProcess[]> {
    return this.findByStatus('failed');
  }

  async findPendingTaskProcessByStatusAndType(status: TaskProcessStatus, type: TaskProcessType, limit: number = 10): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE status = $1 AND type = $2 AND scheduled_to <= NOW() ORDER BY created_at ASC LIMIT $3',
      [status, type, limit]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async searchProcessedTasks(criteria: TaskProcessSearchCriteria): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    let sql = 'SELECT * FROM task_processes WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.entityId) {
      sql += ' AND entity_id = $' + (params.length + 1);
      params.push(criteria.entityId);
    }

    if (criteria.customerId) {
      sql += ' AND customer_id = $' + (params.length + 1);
      params.push(criteria.customerId);
    }

    if (criteria.type) {
      sql += ' AND type = $' + (params.length + 1);
      params.push(criteria.type);
    }

    if (criteria.status) {
      sql += ' AND status = $' + (params.length + 1);
      params.push(criteria.status);
    }

    if (criteria.dateFrom || criteria.dateTo) {
      if (criteria.dateFrom) {
        sql += ' AND created_at >= $' + (params.length + 1);
        params.push(criteria.dateFrom.toISOString());
      }
      if (criteria.dateTo) {
        sql += ' AND created_at <= $' + (params.length + 1);
        params.push(criteria.dateTo.toISOString());
      }
    }

    if (criteria.scheduledTo) {
      sql += ' AND scheduled_to = $' + (params.length + 1);
      params.push(criteria.scheduledTo.toISOString());
    }

    if (criteria.processAt) {
      sql += ' AND process_at = $' + (params.length + 1);
      params.push(criteria.processAt.toISOString());
    }

    sql += ' ORDER BY created_at DESC';

    const result = await connection.query(sql, params);
    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async findAll(): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query('SELECT * FROM task_processes ORDER BY created_at DESC');
    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'DELETE FROM task_processes WHERE id = $1',
      [id]
    );

    return result.rowCount === 1;
  }

  async deleteByEntityId(entityId: string): Promise<void> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'DELETE FROM task_processes WHERE entity_id = $1',
      [entityId]
    );

    if (result.rowCount === 0) {
      throw new Error(`No task processes found with entity_id: ${entityId}`);
    }
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'DELETE FROM task_processes WHERE customer_id = $1',
      [customerId]
    );

    if (result.rowCount === 0) {
      throw new Error(`No task processes found with customer_id: ${customerId}`);
    }
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query('SELECT COUNT(*) as count FROM task_processes');
    return (result.rows[0] as unknown as { count: number })?.count || 0;
  }

  async countByStatus(status: TaskProcessStatus): Promise<number> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT COUNT(*) as count FROM task_processes WHERE status = $1',
      [status]
    );
    
    return (result.rows[0] as unknown as { count: number })?.count || 0;
  }

  async countByType(type: TaskProcessType): Promise<number> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT COUNT(*) as count FROM task_processes WHERE type = $1',
      [type]
    );
    
    return (result.rows[0] as unknown as { count: number })?.count || 0;
  }

  async getTasksCreatedToday(): Promise<TaskProcess[]> {
    const today = moment().startOf('day');
    const tomorrow = moment().endOf('day');
    return this.findByDateRange(today.toDate(), tomorrow.toDate());
  }

  async getTasksCreatedThisWeek(): Promise<TaskProcess[]> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    return this.findByDateRange(weekStart.toDate(), weekEnd.toDate());
  }

  async getTasksCreatedThisMonth(): Promise<TaskProcess[]> {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    return this.findByDateRange(monthStart.toDate(), monthEnd.toDate());
  }

  async getTasksScheduledForDate(date: Date): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const dateStart = moment(date).startOf('day').toISOString();
    const dateEnd = moment(date).endOf('day').toISOString();
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE scheduled_to BETWEEN $1 AND $2 ORDER BY scheduled_to ASC',
      [dateStart, dateEnd]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  async getTasksScheduledForDateRange(dateFrom: Date, dateTo: Date): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE scheduled_to BETWEEN $1 AND $2 ORDER BY scheduled_to ASC',
      [dateFrom.toISOString(), dateTo.toISOString()]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  private async findByDateRange(dateFrom: Date, dateTo: Date): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const result = await connection.query(
      'SELECT * FROM task_processes WHERE created_at BETWEEN $1 AND $2 ORDER BY created_at DESC',
      [dateFrom.toISOString(), dateTo.toISOString()]
    );

    return result.rows.map(row => this.mapToTaskProcess(row as unknown as TaskProcessData));
  }

  private mapToTaskProcess(data: TaskProcessData): TaskProcess {
    return new TaskProcess(
      data.entity_id,
      data.customer_id,
      data.type,
      data.status,
      data.id,
      data.error_msg,
      data.scheduled_to ? new Date(data.scheduled_to) : undefined,
      data.process_at ? new Date(data.process_at) : undefined,
      new Date(data.created_at)
    );
  }
} 