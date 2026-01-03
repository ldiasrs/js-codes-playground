import { LoggerPort } from "../../../../shared/ports/LoggerPort";
import { Topic } from "../../../topic/domain/Topic";
import { TopicRepositoryPort } from "../../../topic/application/ports/TopicRepositoryPort";
import { CreateNewSimilarTopicsProcessor } from "../../../topic-histoy/application/use-cases/CreateNewSimilarTopicsProcessor";
import { TopicHistoryRepositoryPort } from "../../../topic-histoy/application/ports/TopicHistoryRepositoryPort";

interface TopicWithHistoryCount {
  topic: Topic;
  historyCount: number;
}

/**
 * Selects eligible topics to process next, considering limits and history counts.
 */
export class SelectTopicsService {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly logger: LoggerPort,
    private readonly concurrencyLimit: number,
    private readonly maxHistoriesBeforeClose: number,
    private readonly createNewSimilarTopicsProcessor: CreateNewSimilarTopicsProcessor
  ) {}

  async execute(customerId: string, topicsNeeded: number, maxTopicsToProcess: number): Promise<Topic[]> {
    const topics = await this.topicRepository.findByCustomerId(customerId);
    const openTopics = topics.filter(topic => !topic.closed);
    if (openTopics.length === 0) {
      this.logger.info('No open topics available for processing', { customerId });
      const created = await this.createNewSimilarTopicsProcessor.execute(customerId, topicsNeeded);
      if (created.length === 0) {
        return [];
      }
      // Created topics are new and eligible (no histories). Return up to topicsNeeded.
      return created.slice(0, topicsNeeded);
    }
    const limitedTopics = openTopics.slice(0, maxTopicsToProcess);
    const topicsWithHistoryCount = await this.getTopicsWithHistoryCountBatch(limitedTopics);
    const eligibleTopics = topicsWithHistoryCount.filter(item => item.historyCount <= this.maxHistoriesBeforeClose);
    const selected = eligibleTopics
      .sort((a, b) => a.historyCount - b.historyCount)
      .slice(0, topicsNeeded)
      .map(item => item.topic);
    if (selected.length === 0) {
      // No eligible topics, try creating new similar topics and return them
      const created = await this.createNewSimilarTopicsProcessor.execute(customerId, topicsNeeded);
      return created.slice(0, topicsNeeded);
    }
    return selected;
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


