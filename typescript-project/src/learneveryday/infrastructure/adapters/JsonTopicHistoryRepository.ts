import * as fs from 'fs/promises';
import * as path from 'path';
import { TopicHistory } from '../../domain/entities/TopicHistory';
import { TopicHistoryRepositoryPort, TopicHistorySearchCriteria, TopicActivitySummary } from '../../domain/ports/TopicHistoryRepositoryPort';
import moment from 'moment';

interface TopicHistoryData {
  id: string;
  topicId: string;
  content: string;
  createdAt: string;
}

export class JsonTopicHistoryRepository implements TopicHistoryRepositoryPort {
  private readonly dataDir: string;
  private readonly topicHistoriesFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.topicHistoriesFile = path.join(dataDir, 'topic-histories.json');
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private async readTopicHistoriesFile(): Promise<TopicHistoryData[]> {
    try {
      const data = await fs.readFile(this.topicHistoriesFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async writeTopicHistoriesFile(histories: TopicHistoryData[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(this.topicHistoriesFile, JSON.stringify(histories, null, 2), 'utf-8');
  }

  private topicHistoryToData(topicHistory: TopicHistory): TopicHistoryData {
    return {
      id: topicHistory.id,
      topicId: topicHistory.topicId,
      content: topicHistory.content,
      createdAt: topicHistory.createdAt.toISOString()
    };
  }

  private dataToTopicHistory(data: TopicHistoryData): TopicHistory {
    return new TopicHistory(
      data.topicId,
      data.content,
      data.id,
      new Date(data.createdAt)
    );
  }

  async save(topicHistory: TopicHistory): Promise<TopicHistory> {
    const histories = await this.readTopicHistoriesFile();
    const existingIndex = histories.findIndex(h => h.id === topicHistory.id);
    
    if (existingIndex >= 0) {
      histories[existingIndex] = this.topicHistoryToData(topicHistory);
    } else {
      histories.push(this.topicHistoryToData(topicHistory));
    }
    
    await this.writeTopicHistoriesFile(histories);
    return topicHistory;
  }

  async saveFromInterface(topicHistory: ITopicHistory): Promise<TopicHistory> {
    const history = TopicHistory.createFromInterface(topicHistory);
    return this.save(history);
  }

  async findById(id: string): Promise<TopicHistory | undefined> {
    const histories = await this.readTopicHistoriesFile();
    const historyData = histories.find(h => h.id === id);
    return historyData ? this.dataToTopicHistory(historyData) : undefined;
  }

  async findAll(): Promise<TopicHistory[]> {
    const histories = await this.readTopicHistoriesFile();
    return histories.map(data => this.dataToTopicHistory(data));
  }

  async findByTopicId(topicId: string): Promise<TopicHistory[]> {
    const histories = await this.findAll();
    return histories.filter(history => history.topicId === topicId);
  }

  async findByContent(content: string): Promise<TopicHistory[]> {
    const histories = await this.findAll();
    return histories.filter(history => 
      history.content.toLowerCase().includes(content.toLowerCase())
    );
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<TopicHistory[]> {
    const histories = await this.findAll();
    return histories.filter(history => {
      const historyDate = moment(history.createdAt);
      return historyDate.isBetween(moment(dateFrom), moment(dateTo), 'day', '[]');
    });
  }

  async findRecent(hours: number): Promise<TopicHistory[]> {
    const histories = await this.findAll();
    return histories.filter(history => history.isRecent(hours));
  }

  async search(criteria: TopicHistorySearchCriteria): Promise<TopicHistory[]> {
    let results = await this.findAll();

    if (criteria.topicId) {
      results = results.filter(history => history.topicId === criteria.topicId);
    }

    if (criteria.content) {
      results = results.filter(history => 
        history.content.toLowerCase().includes(criteria.content!.toLowerCase())
      );
    }

    if (criteria.dateFrom || criteria.dateTo) {
      const dateFrom = criteria.dateFrom || new Date(0);
      const dateTo = criteria.dateTo || new Date();
      results = results.filter(history => {
        const historyDate = moment(history.createdAt);
        return historyDate.isBetween(moment(dateFrom), moment(dateTo), 'day', '[]');
      });
    }

    if (criteria.isRecent) {
      const hours = criteria.recentHours || 24;
      results = results.filter(history => history.isRecent(hours));
    }

    return results;
  }

  async delete(id: string): Promise<boolean> {
    const histories = await this.readTopicHistoriesFile();
    const initialLength = histories.length;
    const filteredHistories = histories.filter(h => h.id !== id);
    
    if (filteredHistories.length < initialLength) {
      await this.writeTopicHistoriesFile(filteredHistories);
      return true;
    }
    
    return false;
  }

  async deleteByTopicId(topicId: string): Promise<number> {
    const histories = await this.readTopicHistoriesFile();
    const initialLength = histories.length;
    const filteredHistories = histories.filter(h => h.topicId !== topicId);
    
    if (filteredHistories.length < initialLength) {
      await this.writeTopicHistoriesFile(filteredHistories);
      return initialLength - filteredHistories.length;
    }
    
    return 0;
  }

  async count(): Promise<number> {
    const histories = await this.readTopicHistoriesFile();
    return histories.length;
  }

  async countByTopicId(topicId: string): Promise<number> {
    const histories = await this.findByTopicId(topicId);
    return histories.length;
  }

  async getLatestByTopicId(topicId: string): Promise<TopicHistory | undefined> {
    const topicHistories = await this.findByTopicId(topicId);
    if (topicHistories.length === 0) return undefined;

    return topicHistories.reduce((latest, current) => 
      moment(current.createdAt).isAfter(moment(latest.createdAt)) ? current : latest
    );
  }

  async getHistoriesCreatedToday(): Promise<TopicHistory[]> {
    const today = moment().startOf('day');
    const tomorrow = moment().endOf('day');
    
    const histories = await this.findAll();
    return histories.filter(history => {
      const historyDate = moment(history.createdAt);
      return historyDate.isBetween(today, tomorrow, 'day', '[]');
    });
  }

  async getHistoriesCreatedThisWeek(): Promise<TopicHistory[]> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    
    const histories = await this.findAll();
    return histories.filter(history => {
      const historyDate = moment(history.createdAt);
      return historyDate.isBetween(weekStart, weekEnd, 'day', '[]');
    });
  }

  async getHistoriesCreatedThisMonth(): Promise<TopicHistory[]> {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    
    const histories = await this.findAll();
    return histories.filter(history => {
      const historyDate = moment(history.createdAt);
      return historyDate.isBetween(monthStart, monthEnd, 'day', '[]');
    });
  }

  async getTopicActivitySummary(topicId: string): Promise<TopicActivitySummary> {
    const topicHistories = await this.findByTopicId(topicId);
    
    if (topicHistories.length === 0) {
      return {
        totalEntries: 0,
        latestEntry: undefined,
        firstEntry: undefined,
        averageEntriesPerDay: 0
      };
    }

    const sortedHistories = topicHistories.sort((a, b) => 
      moment(a.createdAt).valueOf() - moment(b.createdAt).valueOf()
    );

    const firstEntry = sortedHistories[0];
    const latestEntry = sortedHistories[sortedHistories.length - 1];
    
    const daysDiff = moment(latestEntry.createdAt).diff(moment(firstEntry.createdAt), 'days') + 1;
    const averageEntriesPerDay = topicHistories.length / daysDiff;

    return {
      totalEntries: topicHistories.length,
      latestEntry,
      firstEntry,
      averageEntriesPerDay
    };
  }
} 