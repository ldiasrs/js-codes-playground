import { Topic } from '../../../domain/topic/entities/Topic';
import { TopicRepositoryPort, TopicSearchCriteria } from '../../../domain/topic/ports/TopicRepositoryPort';
import { DatabaseManager } from '../../database/DatabaseManager';
import moment from 'moment';

interface TopicData {
  id: string;
  customer_id: string;
  subject: string;
  date_created: string;
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
      date_created: topic.dateCreated.toISOString()
    };

    await connection.query(
      `INSERT INTO topics 
       (id, customer_id, subject, date_created)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         subject = EXCLUDED.subject,
         date_created = EXCLUDED.date_created`,
      [
        topicData.id,
        topicData.customer_id,
        topicData.subject,
        topicData.date_created
      ]
    );

    return topic;
  }

  async findById(id: string): Promise<Topic | undefined> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query(
      'SELECT * FROM topics WHERE id = ?',
      [id]
    ) as unknown as TopicData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToTopic(rows[0]);
  }

  async findAll(): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query('SELECT * FROM topics') as unknown as TopicData[];
    return rows.map(row => this.mapToTopic(row));
  }

  async findByCustomerId(customerId: string): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query(
      'SELECT * FROM topics WHERE customer_id = ?',
      [customerId]
    ) as unknown as TopicData[];

    return rows.map(row => this.mapToTopic(row));
  }

  async findBySubject(subject: string): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query(
      'SELECT * FROM topics WHERE subject LIKE ?',
      [`%${subject}%`]
    ) as unknown as TopicData[];

    return rows.map(row => this.mapToTopic(row));
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query(
      'SELECT * FROM topics WHERE date_created BETWEEN ? AND ?',
      [dateFrom.toISOString(), dateTo.toISOString()]
    ) as unknown as TopicData[];

    return rows.map(row => this.mapToTopic(row));
  }

  async findWithRecentActivity(hours: number): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const cutoffDate = moment().subtract(hours, 'hours').toISOString();
    
    const rows = await connection.query(
      'SELECT * FROM topics WHERE date_created >= ?',
      [cutoffDate]
    ) as unknown as TopicData[];

    return rows.map(row => this.mapToTopic(row));
  }

  async findTopicsWithOldestHistories(limit: number = 10, hoursSinceLastUpdate: number = 24): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    const cutoffDate = moment().subtract(hoursSinceLastUpdate, 'hours').toISOString();
    
    // Find topics that haven't been updated in the last X hours
    const rows = await connection.query(
      `SELECT t.* FROM topics t
       LEFT JOIN topic_histories th ON t.id = th.topic_id
       WHERE th.created_at IS NULL OR th.created_at < ?
       ORDER BY th.created_at ASC
       LIMIT ?`,
      [cutoffDate, limit]
    ) as unknown as TopicData[];

    return rows.map(row => this.mapToTopic(row));
  }

  async existsByCustomerIdAndSubject(customerId: string, subject: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query(
      'SELECT COUNT(*) as count FROM topics WHERE customer_id = ? AND subject = ?',
      [customerId, subject]
    ) as unknown as { count: number }[];

    return (rows[0]?.count || 0) > 0;
  }

  async search(criteria: TopicSearchCriteria): Promise<Topic[]> {
    const connection = await this.dbManager.getConnection('topics');
    
    let sql = 'SELECT * FROM topics WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.customerId) {
      sql += ' AND customer_id = ?';
      params.push(criteria.customerId);
    }

    if (criteria.subject) {
      sql += ' AND subject LIKE ?';
      params.push(`%${criteria.subject}%`);
    }

    if (criteria.dateFrom || criteria.dateTo) {
      if (criteria.dateFrom) {
        sql += ' AND date_created >= ?';
        params.push(criteria.dateFrom.toISOString());
      }
      if (criteria.dateTo) {
        sql += ' AND date_created <= ?';
        params.push(criteria.dateTo.toISOString());
      }
    }

    const rows = await connection.query(sql, params) as unknown as TopicData[];
    return rows.map(row => this.mapToTopic(row));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('topics');
    
    await connection.query(
      'DELETE FROM topics WHERE id = ?',
      [id]
    );

    return true;
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query('SELECT COUNT(*) as count FROM topics') as { count: number }[];
    return rows[0]?.count || 0;
  }

  async countByCustomerId(customerId: string): Promise<number> {
    const connection = await this.dbManager.getConnection('topics');
    
    const rows = await connection.query(
      'SELECT COUNT(*) as count FROM topics WHERE customer_id = ?',
      [customerId]
    ) as { count: number }[];
    
    return rows[0]?.count || 0;
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
      new Date(data.date_created)
    );
  }
} 