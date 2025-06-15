import * as fs from 'fs/promises';
import * as path from 'path';
import { Topic } from '../../domain/topic/entities/Topic';
import { TopicRepositoryPort, TopicSearchCriteria } from '../../domain/topic/ports/TopicRepositoryPort';
const moment = require('moment');

interface TopicData {
  id: string;
  customerId: string;
  subject: string;
  dateCreated: string;
}

export class JsonTopicRepository implements TopicRepositoryPort {
  private readonly dataDir: string;
  private readonly topicsFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.topicsFile = path.join(dataDir, 'topics.json');
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private async readTopicsFile(): Promise<TopicData[]> {
    try {
      const data = await fs.readFile(this.topicsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async writeTopicsFile(topics: TopicData[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(this.topicsFile, JSON.stringify(topics, null, 2), 'utf-8');
  }

  private topicToData(topic: Topic): TopicData {
    return {
      id: topic.id,
      customerId: topic.customerId,
      subject: topic.subject,
      dateCreated: topic.dateCreated.toISOString()
    };
  }

  private dataToTopic(data: TopicData): Topic {
    return new Topic(
      data.customerId,
      data.subject,
      data.id,
      new Date(data.dateCreated)
    );
  }

  async save(topic: Topic): Promise<Topic> {
    const topics = await this.readTopicsFile();
    const existingIndex = topics.findIndex(t => t.id === topic.id);
    
    if (existingIndex >= 0) {
      topics[existingIndex] = this.topicToData(topic);
    } else {
      topics.push(this.topicToData(topic));
    }
    
    await this.writeTopicsFile(topics);
    return topic;
  }

  async findById(id: string): Promise<Topic | undefined> {
    const topics = await this.readTopicsFile();
    const topicData = topics.find(t => t.id === id);
    return topicData ? this.dataToTopic(topicData) : undefined;
  }

  async findAll(): Promise<Topic[]> {
    const topics = await this.readTopicsFile();
    return topics.map(data => this.dataToTopic(data));
  }

  async findByCustomerId(customerId: string): Promise<Topic[]> {
    const topics = await this.readTopicsFile();
    return topics
      .filter(data => data.customerId === customerId)
      .map(data => this.dataToTopic(data));
  }

  async findBySubject(subject: string): Promise<Topic[]> {
    const topics = await this.readTopicsFile();
    return topics
      .filter(data => data.subject.toLowerCase().includes(subject.toLowerCase()))
      .map(data => this.dataToTopic(data));
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Topic[]> {
    const topics = await this.readTopicsFile();
    return topics
      .filter(data => {
        const topicDate = moment(data.dateCreated);
        return topicDate.isBetween(moment(dateFrom), moment(dateTo), 'day', '[]');
      })
      .map(data => this.dataToTopic(data));
  }

  async findWithRecentActivity(hours: number): Promise<Topic[]> {
    // Since Topic entity doesn't have history, we'll return empty array
    // This method would need to be implemented differently if history is needed
    return [];
  }

  async search(criteria: TopicSearchCriteria): Promise<Topic[]> {
    let results = await this.readTopicsFile();

    if (criteria.subject) {
      results = results.filter(data => 
        data.subject.toLowerCase().includes(criteria.subject!.toLowerCase())
      );
    }

    if (criteria.customerId) {
      results = results.filter(data => data.customerId === criteria.customerId);
    }

    if (criteria.dateFrom || criteria.dateTo) {
      const dateFrom = criteria.dateFrom || new Date(0);
      const dateTo = criteria.dateTo || new Date();
      results = results.filter(data => {
        const topicDate = moment(data.dateCreated);
        return topicDate.isBetween(moment(dateFrom), moment(dateTo), 'day', '[]');
      });
    }

    return results.map(data => this.dataToTopic(data));
  }

  async delete(id: string): Promise<boolean> {
    const topics = await this.readTopicsFile();
    const initialLength = topics.length;
    const filteredTopics = topics.filter(t => t.id !== id);
    
    if (filteredTopics.length < initialLength) {
      await this.writeTopicsFile(filteredTopics);
      return true;
    }
    
    return false;
  }

  async count(): Promise<number> {
    const topics = await this.readTopicsFile();
    return topics.length;
  }

  async getTopicsCreatedToday(): Promise<Topic[]> {
    const today = moment().startOf('day');
    const tomorrow = moment().endOf('day');
    
    const topics = await this.readTopicsFile();
    return topics
      .filter(data => {
        const topicDate = moment(data.dateCreated);
        return topicDate.isBetween(today, tomorrow, 'day', '[]');
      })
      .map(data => this.dataToTopic(data));
  }

  async getTopicsCreatedThisWeek(): Promise<Topic[]> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    
    const topics = await this.readTopicsFile();
    return topics
      .filter(data => {
        const topicDate = moment(data.dateCreated);
        return topicDate.isBetween(weekStart, weekEnd, 'day', '[]');
      })
      .map(data => this.dataToTopic(data));
  }

  async getTopicsCreatedThisMonth(): Promise<Topic[]> {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    
    const topics = await this.readTopicsFile();
    return topics
      .filter(data => {
        const topicDate = moment(data.dateCreated);
        return topicDate.isBetween(monthStart, monthEnd, 'day', '[]');
      })
      .map(data => this.dataToTopic(data));
  }

  async existsByCustomerIdAndSubject(customerId: string, subject: string): Promise<boolean> {
    const topics = await this.readTopicsFile();
    const normalizedSubject = subject.toLowerCase().trim();
    
    return topics.some(data => 
      data.customerId === customerId && 
      data.subject.toLowerCase().trim() === normalizedSubject
    );
  }
} 