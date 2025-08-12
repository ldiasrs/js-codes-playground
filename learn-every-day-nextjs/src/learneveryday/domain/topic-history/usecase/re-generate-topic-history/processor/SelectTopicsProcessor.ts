import { LoggerPort } from "@/learneveryday/domain/shared";
import { Topic } from "@/learneveryday/domain/topic/entities/Topic";
import { TopicRepositoryPort } from "@/learneveryday/domain/topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../../../ports/TopicHistoryRepositoryPort";

interface TopicWithHistoryCount {
  topic: Topic;
  historyCount: number;
}

/**
 * Selects eligible topics to process next, considering limits and history counts.
 */
export class SelectTopicsProcessor {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly concurrencyLimit: number,
    private readonly maxHistoriesBeforeClose: number
  ) {}

  async execute(customerId: string, topicsNeeded: number, maxTopicsToProcess: number): Promise<Topic[]> {
    const topics = await this.topicRepository.findByCustomerId(customerId);
    const openTopics = topics.filter(topic => !topic.closed);
    if (openTopics.length === 0) {
      this.logger.info('No open topics available for processing', { customerId });
      return [];
    }
    const limitedTopics = openTopics.slice(0, maxTopicsToProcess);
    const topicsWithHistoryCount = await this.getTopicsWithHistoryCountBatch(limitedTopics);
    const eligibleTopics = topicsWithHistoryCount.filter(item => item.historyCount <= this.maxHistoriesBeforeClose);
    return eligibleTopics
      .sort((a, b) => a.historyCount - b.historyCount)
      .slice(0, topicsNeeded)
      .map(item => item.topic);
  }

  private async getTopicsWithHistoryCountBatch(topics: Topic[]): Promise<TopicWithHistoryCount[]> {
    try {
      const results: TopicWithHistoryCount[] = [];
      for (let i = 0; i < topics.length; i += this.concurrencyLimit) {
        const batch = topics.slice(i, i + this.concurrencyLimit);
        const batchResults = await this.processTopicHistoryBatch(batch);
        results.push(...batchResults);
      }
      return results;
    } catch (error) {
      this.logger.error('Error getting topic history counts', error instanceof Error ? error : new Error(String(error)), {
        customerId: 'not-provided'
      });
      return topics.map(topic => ({ topic, historyCount: 0 }));
    }
  }

  private async processTopicHistoryBatch(topics: Topic[]): Promise<TopicWithHistoryCount[]> {
    return await Promise.all(
      topics.map(async topic => {
        const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
        return { topic, historyCount: histories.length };
      })
    );
  }
}


