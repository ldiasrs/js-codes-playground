import { TopicHistory } from '../../../features/topic-histoy/domain/TopicHistory';
import { TopicHistoryRepositoryPort, TopicHistorySearchCriteria } from '../../../features/topic-histoy/application/ports/TopicHistoryRepositoryPort';
import { DatabaseManager } from '../../database/DatabaseManager';
import moment from 'moment';

interface TopicHistoryData {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
}

export class SQLTopicHistoryRepository implements TopicHistoryRepositoryPort {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async save(topicHistory: TopicHistory): Promise<TopicHistory> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const topicHistoryData: TopicHistoryData = {
      id: topicHistory.id,
      topic_id: topicHistory.topicId,
      content: topicHistory.content,
      created_at: topicHistory.createdAt.toISOString()
    };

    await connection.query(
      `INSERT INTO topic_histories 
       (id, topic_id, content, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(id) DO UPDATE SET
         topic_id = EXCLUDED.topic_id,
         content = EXCLUDED.content,
         created_at = EXCLUDED.created_at`,
      [
        topicHistoryData.id,
        topicHistoryData.topic_id,
        topicHistoryData.content,
        topicHistoryData.created_at
      ]
    );

    return topicHistory;
  }

  async findById(id: string): Promise<TopicHistory | undefined> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query(
      'SELECT * FROM topic_histories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapToTopicHistory(result.rows[0] as unknown as TopicHistoryData);
  }

  async findByTopicId(topicId: string): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query(
      'SELECT * FROM topic_histories WHERE topic_id = $1 ORDER BY created_at DESC',
      [topicId]
    );

    return result.rows.map(row => this.mapToTopicHistory(row as unknown as TopicHistoryData));
  }

  async findByContent(content: string): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query(
      'SELECT * FROM topic_histories WHERE content LIKE $1 ORDER BY created_at DESC',
      [`%${content}%`]
    );

    return result.rows.map(row => this.mapToTopicHistory(row as unknown as TopicHistoryData));
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query(
      'SELECT * FROM topic_histories WHERE created_at BETWEEN $1 AND $2 ORDER BY created_at DESC',
      [dateFrom.toISOString(), dateTo.toISOString()]
    );

    return result.rows.map(row => this.mapToTopicHistory(row as unknown as TopicHistoryData));
  }

  async findWithRecentActivity(hours: number): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const cutoffDate = moment().subtract(hours, 'hours').toISOString();
    
    const result = await connection.query(
      'SELECT * FROM topic_histories WHERE created_at >= $1 ORDER BY created_at DESC',
      [cutoffDate]
    );

    return result.rows.map(row => this.mapToTopicHistory(row as unknown as TopicHistoryData));
  }

  async search(criteria: TopicHistorySearchCriteria): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    let sql = 'SELECT * FROM topic_histories WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.topicId) {
      sql += ' AND topic_id = $' + (params.length + 1);
      params.push(criteria.topicId);
    }

    if (criteria.content) {
      sql += ' AND content LIKE $' + (params.length + 1);
      params.push(`%${criteria.content}%`);
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

    sql += ' ORDER BY created_at DESC';

    const result = await connection.query(sql, params);
    return result.rows.map(row => this.mapToTopicHistory(row as unknown as TopicHistoryData));
  }

  async findLastTopicHistoryByCustomerId(customerId: string): Promise<TopicHistory | undefined> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query(
      `SELECT th.* FROM topic_histories th
       INNER JOIN topics t ON th.topic_id = t.id
       WHERE t.customer_id = $1
       ORDER BY th.created_at DESC
       LIMIT 1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapToTopicHistory(result.rows[0] as unknown as TopicHistoryData);
  }

  async findByCustomerId(customerId: string): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    // Since TopicHistory doesn't have customerId, we need to get it from topics
    const result = await connection.query(
      `SELECT th.* FROM topic_histories th
       INNER JOIN topics t ON th.topic_id = t.id
       WHERE t.customer_id = $1
       ORDER BY th.created_at DESC`,
      [customerId]
    );

    return result.rows.map(row => this.mapToTopicHistory(row as unknown as TopicHistoryData));
  }

  async findAll(): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query('SELECT * FROM topic_histories ORDER BY created_at DESC');
    return result.rows.map(row => this.mapToTopicHistory(row as unknown as TopicHistoryData));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query(
      'DELETE FROM topic_histories WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  async deleteByTopicId(topicId: string): Promise<void> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query(
      'DELETE FROM topic_histories WHERE topic_id = $1',
      [topicId]
    );
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const result = await connection.query('SELECT COUNT(*) as count FROM topic_histories');
    return (result.rows[0] as unknown as { count: number })?.count || 0;
  }

  async getTopicHistoryCreatedToday(): Promise<TopicHistory[]> {
    const today = moment().startOf('day');
    const tomorrow = moment().endOf('day');
    return this.findByDateRange(today.toDate(), tomorrow.toDate());
  }

  async getTopicHistoryCreatedThisWeek(): Promise<TopicHistory[]> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    return this.findByDateRange(weekStart.toDate(), weekEnd.toDate());
  }

  async getTopicHistoryCreatedThisMonth(): Promise<TopicHistory[]> {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    return this.findByDateRange(monthStart.toDate(), monthEnd.toDate());
  }

  private mapToTopicHistory(data: TopicHistoryData): TopicHistory {
    return new TopicHistory(
      data.topic_id,
      data.content,
      data.id,
      new Date(data.created_at)
    );
  }
} 