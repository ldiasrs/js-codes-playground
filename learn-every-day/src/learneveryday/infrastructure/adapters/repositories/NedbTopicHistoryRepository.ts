import 'reflect-metadata';
import { injectable } from 'inversify';
import Datastore from 'nedb';
import { TopicHistory } from '../../../domain/topic-history/entities/TopicHistory';
import { TopicHistoryRepositoryPort, TopicHistorySearchCriteria } from '../../../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { NedbDatabaseManager } from '../../database/NedbDatabaseManager';
import moment from 'moment';

interface TopicHistoryData {
  _id?: string;
  topicId: string;
  content: string;
  createdAt: string;
}

interface TopicData {
  _id?: string;
  customerId: string;
  subject: string;
  dateCreated: string;
}

interface TopicActivitySummary {
  totalEntries: number;
  latestEntry?: TopicHistory;
  firstEntry?: TopicHistory;
  averageEntriesPerDay: number;
}

@injectable()
export class NedbTopicHistoryRepository implements TopicHistoryRepositoryPort {
  private db: Datastore;
  private readonly topicDb: Datastore;

  constructor() {
    const dbManager = NedbDatabaseManager.getInstance();
    this.db = dbManager.getTopicHistoryDatabase();
    this.topicDb = dbManager.getTopicDatabase();
  }

  private topicHistoryToData(topicHistory: TopicHistory): TopicHistoryData {
    return {
      _id: topicHistory.id,
      topicId: topicHistory.topicId,
      content: topicHistory.content,
      createdAt: topicHistory.createdAt.toISOString()
    };
  }

  private dataToTopicHistory(data: TopicHistoryData): TopicHistory {
    return new TopicHistory(
      data.topicId,
      data.content,
      data._id!,
      new Date(data.createdAt)
    );
  }

  async save(topicHistory: TopicHistory): Promise<TopicHistory> {
    return new Promise((resolve, reject) => {
      const historyData = this.topicHistoryToData(topicHistory);
      
      this.db.update(
        { _id: topicHistory.id },
        historyData,
        { upsert: true },
        (err, numReplaced) => {
          if (err) {
            reject(err);
          } else {
            resolve(topicHistory);
          }
        }
      );
    });
  }

  async findById(id: string): Promise<TopicHistory | undefined> {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: id }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc ? this.dataToTopicHistory(doc) : undefined);
        }
      });
    });
  }

  async findAll(): Promise<TopicHistory[]> {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTopicHistory(doc)));
        }
      });
    });
  }

  async findByTopicId(topicId: string): Promise<TopicHistory[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ topicId }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTopicHistory(doc)));
        }
      });
    });
  }

  async findByContent(content: string): Promise<TopicHistory[]> {
    return new Promise((resolve, reject) => {
      this.db.find(
        { content: { $regex: new RegExp(content, 'i') } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTopicHistory(doc)));
          }
        }
      );
    });
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<TopicHistory[]> {
    return new Promise((resolve, reject) => {
      this.db.find(
        {
          createdAt: {
            $gte: dateFrom.toISOString(),
            $lte: dateTo.toISOString()
          }
        },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTopicHistory(doc)));
          }
        }
      );
    });
  }

  async findWithRecentActivity(hours: number): Promise<TopicHistory[]> {
    return new Promise((resolve, reject) => {
      const cutoffDate = moment().subtract(hours, 'hours').toISOString();
      
      this.db.find(
        { createdAt: { $gte: cutoffDate } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTopicHistory(doc)));
          }
        }
      );
    });
  }

  async search(criteria: TopicHistorySearchCriteria): Promise<TopicHistory[]> {
    return new Promise((resolve, reject) => {
      const query: any = {};

      if (criteria.topicId) {
        query.topicId = criteria.topicId;
      }

      if (criteria.content) {
        query.content = { $regex: new RegExp(criteria.content, 'i') };
      }

      if (criteria.dateFrom || criteria.dateTo) {
        query.createdAt = {};
        if (criteria.dateFrom) {
          query.createdAt.$gte = criteria.dateFrom.toISOString();
        }
        if (criteria.dateTo) {
          query.createdAt.$lte = criteria.dateTo.toISOString();
        }
      }

      this.db.find(query, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTopicHistory(doc)));
        }
      });
    });
  }

  async findLastTopicHistoryByCustomerId(customerId: string): Promise<TopicHistory | undefined> {
    return new Promise((resolve, reject) => {
      // First, find all topics for this customer
      this.topicDb.find({ customerId }, (err, topicDocs) => {
        if (err) {
          reject(err);
        } else {
          if (topicDocs.length === 0) {
            resolve(undefined);
            return;
          }

          const topicIds = topicDocs.map(doc => doc._id);
          
          // Find the latest topic history for any of these topics
          this.db.findOne(
            { topicId: { $in: topicIds } },
            { sort: { createdAt: -1 } },
            (err, historyDoc) => {
              if (err) {
                reject(err);
              } else {
                resolve(historyDoc ? this.dataToTopicHistory(historyDoc) : undefined);
              }
            }
          );
        }
      });
    });
  }

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved > 0);
        }
      });
    });
  }

  async deleteByTopicId(topicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.remove({ topicId }, { multi: true }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async count(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.count({}, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
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

  async getLatestByTopicId(topicId: string): Promise<TopicHistory | undefined> {
    return new Promise((resolve, reject) => {
      this.db.findOne(
        { topicId },
        { sort: { createdAt: -1 } },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc ? this.dataToTopicHistory(doc) : undefined);
          }
        }
      );
    });
  }

  async getHistoriesCreatedToday(): Promise<TopicHistory[]> {
    return this.getTopicHistoryCreatedToday();
  }

  async getHistoriesCreatedThisWeek(): Promise<TopicHistory[]> {
    return this.getTopicHistoryCreatedThisWeek();
  }

  async getHistoriesCreatedThisMonth(): Promise<TopicHistory[]> {
    return this.getTopicHistoryCreatedThisMonth();
  }

  async getTopicActivitySummary(topicId: string): Promise<TopicActivitySummary> {
    return new Promise((resolve, reject) => {
      this.db.find({ topicId }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          const histories = docs.map(doc => this.dataToTopicHistory(doc));
          
          if (histories.length === 0) {
            resolve({
              totalEntries: 0,
              averageEntriesPerDay: 0
            });
            return;
          }

          const sortedHistories = histories.sort((a, b) => 
            moment(a.createdAt).diff(moment(b.createdAt))
          );

          const firstEntry = sortedHistories[0];
          const latestEntry = sortedHistories[sortedHistories.length - 1];
          
          const daysDiff = moment(latestEntry.createdAt).diff(moment(firstEntry.createdAt), 'days') + 1;
          const averageEntriesPerDay = daysDiff > 0 ? histories.length / daysDiff : histories.length;

          resolve({
            totalEntries: histories.length,
            latestEntry,
            firstEntry,
            averageEntriesPerDay
          });
        }
      });
    });
  }

  async countByTopicId(topicId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.count({ topicId }, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }
} 