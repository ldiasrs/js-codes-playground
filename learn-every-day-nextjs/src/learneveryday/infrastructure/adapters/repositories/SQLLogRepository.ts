import { Log } from '../loggers/Log';
import { LogLevel } from '../../../domain/shared/ports/LoggerPort';
import { DatabaseManager } from '../../database/DatabaseManager';

interface LogData {
  id: string;
  level: string;
  message: string;
  context: string;
  error_message?: string;
  error_stack?: string;
  timestamp: string;
}

export interface LogSearchCriteria {
  level?: LogLevel;
  dateFrom?: Date;
  dateTo?: Date;
  message?: string;
  hasError?: boolean;
  limit?: number;
  offset?: number;
}
export class SQLLogRepository  {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async save(log: Log): Promise<Log> {
    const connection = await this.dbManager.getConnection('logs');
    
    const logData = this.mapLogToData(log);

    await connection.query(
      `INSERT INTO logs 
       (id, level, message, context, error_message, error_stack, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(id) DO UPDATE SET
         level = EXCLUDED.level,
         message = EXCLUDED.message,
         context = EXCLUDED.context,
         error_message = EXCLUDED.error_message,
         error_stack = EXCLUDED.error_stack,
         timestamp = EXCLUDED.timestamp`,
      [
        logData.id,
        logData.level,
        logData.message,
        logData.context,
        logData.error_message,
        logData.error_stack,
        logData.timestamp
      ]
    );

    return log;
  }

  async findById(id: string): Promise<Log | null> {
    const connection = await this.dbManager.getConnection('logs');
    
    const result = await connection.query(
      'SELECT * FROM logs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDataToLog(result.rows[0] as unknown as LogData);
  }

  async findByCriteria(criteria: LogSearchCriteria): Promise<Log[]> {
    const connection = await this.dbManager.getConnection('logs');
    
    const { query, params } = this.buildSearchQuery(criteria);
    const result = await connection.query(query, params);

    return result.rows.map(row => this.mapDataToLog(row as unknown as LogData));
  }

  async countByCriteria(criteria: LogSearchCriteria): Promise<number> {
    const connection = await this.dbManager.getConnection('logs');
    
    const { query, params } = this.buildCountQuery(criteria);
    const result = await connection.query(query, params);

    return Number(result.rows[0]?.count || 0);
  }

  async deleteOldLogs(beforeDate: Date): Promise<number> {
    const connection = await this.dbManager.getConnection('logs');
    
    const result = await connection.query(
      'DELETE FROM logs WHERE timestamp < $1',
      [beforeDate.toISOString()]
    );

    return result.rowCount;
  }

  async findByLevelAndDateRange(
    level: LogLevel,
    dateFrom: Date,
    dateTo: Date,
    limit: number = 100
  ): Promise<Log[]> {
    const connection = await this.dbManager.getConnection('logs');
    
    const result = await connection.query(
      `SELECT * FROM logs 
       WHERE level = $1 
         AND timestamp >= $2 
         AND timestamp <= $3 
       ORDER BY timestamp DESC 
       LIMIT $4`,
      [level, dateFrom.toISOString(), dateTo.toISOString(), limit]
    );

    return result.rows.map(row => this.mapDataToLog(row as unknown as LogData));
  }

  private mapLogToData(log: Log): LogData {
    return {
      id: log.id,
      level: log.level,
      message: log.message,
      context: log.getSerializedContext(),
      error_message: log.errorMessage,
      error_stack: log.errorStack,
      timestamp: log.timestamp.toISOString()
    };
  }

  private mapDataToLog(data: LogData): Log {
    const context = this.parseContext(data.context);
    
    return new Log(
      data.id,
      data.level as LogLevel,
      data.message,
      context,
      new Date(data.timestamp),
      data.error_message,
      data.error_stack
    );
  }

  private parseContext(contextJson: string): Record<string, unknown> {
    try {
      return JSON.parse(contextJson) || {};
    } catch {
      return {};
    }
  }

  private buildSearchQuery(criteria: LogSearchCriteria): { query: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (criteria.level) {
      conditions.push(`level = $${paramIndex++}`);
      params.push(criteria.level);
    }

    if (criteria.dateFrom) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(criteria.dateFrom.toISOString());
    }

    if (criteria.dateTo) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(criteria.dateTo.toISOString());
    }

    if (criteria.message) {
      conditions.push(`message ILIKE $${paramIndex++}`);
      params.push(`%${criteria.message}%`);
    }

    if (criteria.hasError !== undefined) {
      if (criteria.hasError) {
        conditions.push('error_message IS NOT NULL');
      } else {
        conditions.push('error_message IS NULL');
      }
    }

    const whereClause = this.buildWhereClause(conditions);
    const orderByClause = 'ORDER BY timestamp DESC';
    const limitClause = this.buildLimitClause(criteria, paramIndex, params);

    const query = `SELECT * FROM logs ${whereClause} ${orderByClause} ${limitClause}`;
    
    return { query, params };
  }

  private buildCountQuery(criteria: LogSearchCriteria): { query: string; params: unknown[] } {
    const { query: searchQuery, params } = this.buildSearchQuery(criteria);
    const query = searchQuery.replace('SELECT * FROM logs', 'SELECT COUNT(*) as count FROM logs')
                             .replace(/ORDER BY.*$/, '')
                             .replace(/LIMIT.*$/, '');
    
    return { query, params };
  }

  private buildWhereClause(conditions: string[]): string {
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  private buildLimitClause(criteria: LogSearchCriteria, paramIndex: number, params: unknown[]): string {
    let clause = '';
    
    if (criteria.limit) {
      clause += `LIMIT $${paramIndex++}`;
      params.push(criteria.limit);
    }

    if (criteria.offset) {
      clause += ` OFFSET $${paramIndex}`;
      params.push(criteria.offset);
    }

    return clause;
  }
} 