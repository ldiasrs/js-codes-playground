import { TopicHistory } from '../../../domain/topic-history/entities/TopicHistory';
import { TopicHistoryRepositoryPort, TopicHistorySearchCriteria } from '../../../domain/topic-history/ports/TopicHistoryRepositoryPort';
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
      `INSERT OR REPLACE INTO topic_histories 
       (id, topic_id, content, created_at)
       VALUES (?, ?, ?, ?)`,
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
    
    const rows = await connection.query(
      'SELECT * FROM topic_histories WHERE id = ?',
      [id]
    ) as TopicHistoryData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToTopicHistory(rows[0]);
  }

  async findByTopicId(topicId: string): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const rows = await connection.query(
      'SELECT * FROM topic_histories WHERE topic_id = ? ORDER BY created_at DESC',
      [topicId]
    ) as TopicHistoryData[];

    return rows.map(row => this.mapToTopicHistory(row));
  }

  async findByContent(content: string): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const rows = await connection.query(
      'SELECT * FROM topic_histories WHERE content LIKE ? ORDER BY created_at DESC',
      [`%${content}%`]
    ) as TopicHistoryData[];

    return rows.map(row => this.mapToTopicHistory(row));
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const rows = await connection.query(
      'SELECT * FROM topic_histories WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [dateFrom.toISOString(), dateTo.toISOString()]
    ) as TopicHistoryData[];

    return rows.map(row => this.mapToTopicHistory(row));
  }

  async findWithRecentActivity(hours: number): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const cutoffDate = moment().subtract(hours, 'hours').toISOString();
    
    const rows = await connection.query(
      'SELECT * FROM topic_histories WHERE created_at >= ? ORDER BY created_at DESC',
      [cutoffDate]
    ) as TopicHistoryData[];

    return rows.map(row => this.mapToTopicHistory(row));
  }

  async search(criteria: TopicHistorySearchCriteria): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    let sql = 'SELECT * FROM topic_histories WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.topicId) {
      sql += ' AND topic_id = ?';
      params.push(criteria.topicId);
    }

    if (criteria.content) {
      sql += ' AND content LIKE ?';
      params.push(`%${criteria.content}%`);
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

    sql += ' ORDER BY created_at DESC';

    const rows = await connection.query(sql, params) as TopicHistoryData[];
    return rows.map(row => this.mapToTopicHistory(row));
  }

  async findLastTopicHistoryByCustomerId(customerId: string): Promise<TopicHistory | undefined> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const rows = await connection.query(
      `SELECT th.* FROM topic_histories th
       INNER JOIN topics t ON th.topic_id = t.id
       WHERE t.customer_id = ?
       ORDER BY th.created_at DESC
       LIMIT 1`,
      [customerId]
    ) as TopicHistoryData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToTopicHistory(rows[0]);
  }

  async findByCustomerId(customerId: string): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    // Since TopicHistory doesn't have customerId, we need to get it from topics
    const rows = await connection.query(
      `SELECT th.* FROM topic_histories th
       INNER JOIN topics t ON th.topic_id = t.id
       WHERE t.customer_id = ?
       ORDER BY th.created_at DESC`,
      [customerId]
    ) as TopicHistoryData[];

    return rows.map(row => this.mapToTopicHistory(row));
  }

  async findAll(): Promise<TopicHistory[]> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const rows = await connection.query('SELECT * FROM topic_histories ORDER BY created_at DESC') as TopicHistoryData[];
    return rows.map(row => this.mapToTopicHistory(row));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    await connection.query(
      'DELETE FROM topic_histories WHERE id = ?',
      [id]
    );

    return true;
  }

  async deleteByTopicId(topicId: string): Promise<void> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    await connection.query(
      'DELETE FROM topic_histories WHERE topic_id = ?',
      [topicId]
    );
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('topic_histories');
    
    const rows = await connection.query('SELECT COUNT(*) as count FROM topic_histories') as { count: number }[];
    return rows[0]?.count || 0;
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