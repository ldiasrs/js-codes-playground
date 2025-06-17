import 'reflect-metadata';
import { injectable } from 'inversify';
import Datastore from 'nedb';
import { Topic } from '../../domain/topic/entities/Topic';
import { TopicRepositoryPort, TopicSearchCriteria } from '../../domain/topic/ports/TopicRepositoryPort';
import { NedbDatabaseManager } from '../database/NedbDatabaseManager';
import moment from 'moment';

interface TopicData {
  _id?: string;
  customerId: string;
  subject: string;
  dateCreated: string;
}

@injectable()
export class NedbTopicRepository implements TopicRepositoryPort {
  private db: Datastore;
  private readonly topicHistoryDb: Datastore;

  constructor() {
    const dbManager = NedbDatabaseManager.getInstance();
    this.db = dbManager.getTopicDatabase();
    this.topicHistoryDb = dbManager.getTopicHistoryDatabase();
  }

  private topicToData(topic: Topic): TopicData {
    return {
      _id: topic.id,
      customerId: topic.customerId,
      subject: topic.subject,
      dateCreated: topic.dateCreated.toISOString()
    };
  }

  private dataToTopic(data: TopicData): Topic {
    return new Topic(
      data.customerId,
      data.subject,
      data._id!,
      new Date(data.dateCreated)
    );
  }

  async save(topic: Topic): Promise<Topic> {
    return new Promise((resolve, reject) => {
      const topicData = this.topicToData(topic);
      
      this.db.update(
        { _id: topic.id },
        topicData,
        { upsert: true },
        (err, numReplaced) => {
          if (err) {
            reject(err);
          } else {
            resolve(topic);
          }
        }
      );
    });
  }

  async findById(id: string): Promise<Topic | undefined> {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: id }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc ? this.dataToTopic(doc) : undefined);
        }
      });
    });
  }

  async findAll(): Promise<Topic[]> {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTopic(doc)));
        }
      });
    });
  }

  async findByCustomerId(customerId: string): Promise<Topic[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ customerId }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTopic(doc)));
        }
      });
    });
  }

  async findBySubject(subject: string): Promise<Topic[]> {
    return new Promise((resolve, reject) => {
      this.db.find(
        { subject: { $regex: new RegExp(subject, 'i') } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTopic(doc)));
          }
        }
      );
    });
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Topic[]> {
    return new Promise((resolve, reject) => {
      this.db.find(
        {
          dateCreated: {
            $gte: dateFrom.toISOString(),
            $lte: dateTo.toISOString()
          }
        },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTopic(doc)));
          }
        }
      );
    });
  }

  async findWithRecentActivity(hours: number): Promise<Topic[]> {
    // Since Topic entity doesn't have history, we'll return empty array
    // This method would need to be implemented differently if history is needed
    return [];
  }

  async search(criteria: TopicSearchCriteria): Promise<Topic[]> {
    return new Promise((resolve, reject) => {
      const query: any = {};

      if (criteria.customerId) {
        query.customerId = criteria.customerId;
      }

      if (criteria.subject) {
        query.subject = { $regex: new RegExp(criteria.subject, 'i') };
      }

      if (criteria.dateFrom || criteria.dateTo) {
        query.dateCreated = {};
        if (criteria.dateFrom) {
          query.dateCreated.$gte = criteria.dateFrom.toISOString();
        }
        if (criteria.dateTo) {
          query.dateCreated.$lte = criteria.dateTo.toISOString();
        }
      }

      this.db.find(query, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTopic(doc)));
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

  async existsByCustomerIdAndSubject(customerId: string, subject: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.findOne(
        { 
          customerId,
          subject: { $regex: new RegExp(`^${subject}$`, 'i') }
        },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!doc);
          }
        }
      );
    });
  }

  async findTopicsWithOldestHistories(hoursSinceLastUpdate: number = 24): Promise<Topic[]> {
    return new Promise((resolve, reject) => {
      // First, get all topics
      this.db.find({}, async (err, topicDocs) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const topics = topicDocs.map(doc => this.dataToTopic(doc));
          const topicsWithHistoryInfo: Array<{ topic: Topic; lastHistoryDate: Date | null }> = [];

          // For each topic, find the latest topic history
          for (const topic of topics) {
            const latestHistory = await this.getLatestTopicHistoryForTopic(topic.id);
            topicsWithHistoryInfo.push({
              topic,
              lastHistoryDate: latestHistory ? latestHistory.createdAt : null
            });
          }

          // Filter topics that haven't been updated in the specified hours
          const cutoffTime = moment().subtract(hoursSinceLastUpdate, 'hours').toDate();
          const eligibleTopics = topicsWithHistoryInfo.filter(item => {
            // Include topics with no history or with old history
            return !item.lastHistoryDate || item.lastHistoryDate < cutoffTime;
          });

          // Group by customer and find the topic with oldest history for each customer
          const customerTopicMap = new Map<string, { topic: Topic; lastHistoryDate: Date | null }>();
          
          for (const item of eligibleTopics) {
            const customerId = item.topic.customerId;
            
            if (!customerTopicMap.has(customerId)) {
              // First topic for this customer
              customerTopicMap.set(customerId, item);
            } else {
              // Compare with existing topic for this customer
              const existing = customerTopicMap.get(customerId)!;
              
              // If current topic has no history and existing has history, keep existing
              if (!item.lastHistoryDate && existing.lastHistoryDate) {
                continue;
              }
              
              // If existing topic has no history and current has history, replace with current
              if (existing.lastHistoryDate && !item.lastHistoryDate) {
                customerTopicMap.set(customerId, item);
                continue;
              }
              
              // If both have history, keep the one with older history
              if (item.lastHistoryDate && existing.lastHistoryDate) {
                if (item.lastHistoryDate < existing.lastHistoryDate) {
                  customerTopicMap.set(customerId, item);
                }
              }
              
              // If neither has history, keep the first one (arbitrary choice)
            }
          }

          // Extract just the topics from the map
          const result: Topic[] = [];
          for (const item of customerTopicMap.values()) {
            result.push(item.topic);
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async getLatestTopicHistoryForTopic(topicId: string): Promise<{ createdAt: Date } | null> {
    return new Promise((resolve, reject) => {
      this.topicHistoryDb.findOne(
        { topicId },
        { sort: { createdAt: -1 } },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc ? { createdAt: new Date(doc.createdAt) } : null);
          }
        }
      );
    });
  }
} 