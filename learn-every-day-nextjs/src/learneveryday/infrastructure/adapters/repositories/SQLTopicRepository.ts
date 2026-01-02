import { Topic } from '../../../features/topic/domain/Topic';
import { TopicRepositoryPort, TopicSearchCriteria } from '../../../features/topic/application/ports/TopicRepositoryPort';
import { DatabaseManager } from '../../database/DatabaseManager';
import moment from 'moment';

interface TopicData {
  id: string;
  customer_id: string;
  subject: string;
  date_created: string;
  closed: boolean;
}

export class SQLTopicRepository implements TopicRepositoryPort {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async save(topic: Topic): Promise<Topic> {
    const connection = await this.dbManager.getConnection('topics');
    
    const topicData: TopicData = {
      id: topic.id,
      customer_id: topic.customerId,
      subject: topic.subject,
      date_created: topic.dateCreated.toISOString(),
      closed: topic.closed
    };

    await connection.query(
      `INSERT INTO topics 
       (id, customer_id, subject, date_created, closed)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT(id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         subject = EXCLUDED.subject,
         date_created = EXCLUDED.date_created,
         closed = EXCLUDED.closed`,
      [
        topicData.id,
        topicData.customer_id,
        topicData.subject,
        topicData.date_created,
        topicData.closed
      ]
    );

    return topic;
  }

  async findById(id: string): Promise<Topic | undefined> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query(
      'SELECT * FROM topics WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapToTopic(result.rows[0] as unknown as TopicData);
  }

  async findAll(): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query('SELECT * FROM topics');
    return result.rows.map(row => this.mapToTopic(row as unknown as TopicData));
  }

  async findByCustomerId(customerId: string): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query(
      'SELECT * FROM topics WHERE customer_id = $1',
      [customerId]
    );

    return result.rows.map(row => this.mapToTopic(row as unknown as TopicData));
  }

  async findBySubject(subject: string): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query(
      'SELECT * FROM topics WHERE subject LIKE $1',
      [`%${subject}%`]
    );

    return result.rows.map(row => this.mapToTopic(row as unknown as TopicData));
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query(
      'SELECT * FROM topics WHERE date_created BETWEEN $1 AND $2',
      [dateFrom.toISOString(), dateTo.toISOString()]
    );

    return result.rows.map(row => this.mapToTopic(row as unknown as TopicData));
  }

  async findWithRecentActivity(hours: number): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const cutoffDate = moment().subtract(hours, 'hours').toISOString();
    
    const result = await connection.query(
      'SELECT * FROM topics WHERE date_created >= $1',
      [cutoffDate]
    );

    return result.rows.map(row => this.mapToTopic(row as unknown as TopicData));
  }

  async findTopicsWithOldestHistories(limit: number = 10, hoursSinceLastUpdate: number = 24): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const cutoffDate = moment().subtract(hoursSinceLastUpdate, 'hours').toISOString();
    
    // Find topics that haven't been updated in the last X hours
    const result = await connection.query(
      `SELECT t.* FROM topics t
       LEFT JOIN topic_histories th ON t.id = th.topic_id
       WHERE th.created_at IS NULL OR th.created_at < $1
       ORDER BY th.created_at ASC
       LIMIT $2`,
      [cutoffDate, limit]
    );

    return result.rows.map(row => this.mapToTopic(row as unknown as TopicData));
  }

  async existsByCustomerIdAndSubject(customerId: string, subject: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query(
      'SELECT COUNT(*) as count FROM topics WHERE customer_id = $1 AND subject = $2',
      [customerId, subject]
    );

    return ((result.rows[0] as unknown as { count: number })?.count || 0) > 0;
  }

  async search(criteria: TopicSearchCriteria): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    let sql = 'SELECT * FROM topics WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.customerId) {
      sql += ' AND customer_id = $' + (params.length + 1);
      params.push(criteria.customerId);
    }

    if (criteria.subject) {
      sql += ' AND subject LIKE $' + (params.length + 1);
      params.push(`%${criteria.subject}%`);
    }

    if (criteria.dateFrom || criteria.dateTo) {
      if (criteria.dateFrom) {
        sql += ' AND date_created >= $' + (params.length + 1);
        params.push(criteria.dateFrom.toISOString());
      }
      if (criteria.dateTo) {
        sql += ' AND date_created <= $' + (params.length + 1);
        params.push(criteria.dateTo.toISOString());
      }
    }

    const result = await connection.query(sql, params);
    return result.rows.map(row => this.mapToTopic(row as unknown as TopicData));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query(
      'DELETE FROM topics WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query('SELECT COUNT(*) as count FROM topics');
    return (result.rows[0] as unknown as { count: number })?.count || 0;
  }

  async countByCustomerId(customerId: string): Promise<number> {
    const connection = await this.dbManager.getConnection('topics');
    
    const result = await connection.query(
      'SELECT COUNT(*) as count FROM topics WHERE customer_id = $1',
      [customerId]
    );
    
    return (result.rows[0] as unknown as { count: number })?.count || 0;
  }

  async getTopicsCreatedToday(): Promise<Topic[]> {
    const today = moment().startOf('day');
    const tomorrow = moment().endOf('day');
    return this.findByDateRange(today.toDate(), tomorrow.toDate());
  }

  async getTopicsCreatedThisWeek(): Promise<Topic[]> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    return this.findByDateRange(weekStart.toDate(), weekEnd.toDate());
  }

  async getTopicsCreatedThisMonth(): Promise<Topic[]> {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    return this.findByDateRange(monthStart.toDate(), monthEnd.toDate());
  }

  private mapToTopic(data: TopicData): Topic {
    return new Topic(
      data.customer_id,
      data.subject,
      data.id,
      new Date(data.date_created),
      data.closed
    );
  }
} 