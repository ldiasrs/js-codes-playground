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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE id = ?',
      [id]
    ) as unknown as TaskProcessData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToTaskProcess(rows[0]);
  }

  async findByEntityId(entityId: string): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE entity_id = ? ORDER BY created_at DESC',
      [entityId]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  async findByCustomerId(customerId: string): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  async findByType(type: TaskProcessType): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE type = ? ORDER BY created_at DESC',
      [type]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  async findByStatus(status: TaskProcessStatus): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE status = ? ORDER BY created_at DESC',
      [status]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  async findByEntityIdAndType(entityId: string, type: TaskProcessType): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE entity_id = ? AND type = ? ORDER BY created_at DESC',
      [entityId, type]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
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
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE scheduled_to IS NOT NULL AND status = ? ORDER BY scheduled_to ASC',
      ['pending']
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  async findFailedTasks(): Promise<TaskProcess[]> {
    return this.findByStatus('failed');
  }

  async findPendingTaskProcessByStatusAndType(status: TaskProcessStatus, type: TaskProcessType, limit: number = 10): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE status = ? AND type = ? ORDER BY created_at ASC LIMIT ?',
      [status, type, limit]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  async search(criteria: TaskProcessSearchCriteria): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    let sql = 'SELECT * FROM task_processes WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.entityId) {
      sql += ' AND entity_id = ?';
      params.push(criteria.entityId);
    }

    if (criteria.customerId) {
      sql += ' AND customer_id = ?';
      params.push(criteria.customerId);
    }

    if (criteria.type) {
      sql += ' AND type = ?';
      params.push(criteria.type);
    }

    if (criteria.status) {
      sql += ' AND status = ?';
      params.push(criteria.status);
    }

    if (criteria.dateFrom || criteria.dateTo) {
      if (criteria.dateFrom) {
        sql += ' AND created_at >= ?';
        params.push(criteria.dateFrom.toISOString());
      }
      if (criteria.dateTo) {
        sql += ' AND created_at <= ?';
        params.push(criteria.dateTo.toISOString());
      }
    }

    if (criteria.scheduledTo) {
      sql += ' AND scheduled_to = ?';
      params.push(criteria.scheduledTo.toISOString());
    }

    if (criteria.processAt) {
      sql += ' AND process_at = ?';
      params.push(criteria.processAt.toISOString());
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await connection.query(sql, params) as unknown as TaskProcessData[];
    return rows.map(row => this.mapToTaskProcess(row));
  }

  async findAll(): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query('SELECT * FROM task_processes ORDER BY created_at DESC') as unknown as TaskProcessData[];
    return rows.map(row => this.mapToTaskProcess(row));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    await connection.query(
      'DELETE FROM task_processes WHERE id = ?',
      [id]
    );

    return true;
  }

  async deleteByEntityId(entityId: string): Promise<void> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    await connection.query(
      'DELETE FROM task_processes WHERE entity_id = ?',
      [entityId]
    );
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    await connection.query(
      'DELETE FROM task_processes WHERE customer_id = ?',
      [customerId]
    );
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query('SELECT COUNT(*) as count FROM task_processes') as { count: number }[];
    return rows[0]?.count || 0;
  }

  async countByStatus(status: TaskProcessStatus): Promise<number> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT COUNT(*) as count FROM task_processes WHERE status = ?',
      [status]
    ) as { count: number }[];
    
    return rows[0]?.count || 0;
  }

  async countByType(type: TaskProcessType): Promise<number> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT COUNT(*) as count FROM task_processes WHERE type = ?',
      [type]
    ) as { count: number }[];
    
    return rows[0]?.count || 0;
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
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE scheduled_to BETWEEN ? AND ? ORDER BY scheduled_to ASC',
      [dateStart, dateEnd]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  async getTasksScheduledForDateRange(dateFrom: Date, dateTo: Date): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE scheduled_to BETWEEN ? AND ? ORDER BY scheduled_to ASC',
      [dateFrom.toISOString(), dateTo.toISOString()]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
  }

  private async findByDateRange(dateFrom: Date, dateTo: Date): Promise<TaskProcess[]> {
    const connection = await this.dbManager.getConnection('task_processes');
    
    const rows = await connection.query(
      'SELECT * FROM task_processes WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [dateFrom.toISOString(), dateTo.toISOString()]
    ) as unknown as TaskProcessData[];

    return rows.map(row => this.mapToTaskProcess(row));
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