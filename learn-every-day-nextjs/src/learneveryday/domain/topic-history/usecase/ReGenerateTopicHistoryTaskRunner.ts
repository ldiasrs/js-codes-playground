import { TaskProcess } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { TopicRepositoryPort } from "../../topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { LoggerPort } from "../../shared/ports/LoggerPort";
import { Topic } from "../../topic/entities/Topic";
import { CustomerRepositoryPort } from "../../customer/ports/CustomerRepositoryPort";
import { TierLimits } from "../../shared/TierLimits";

export interface ReGenerateTopicHistoryConfig {
  maxTopicsPer24h: number; // 1 or 3 or 5 depending on tier
  maxTopicsToProcess: number; // Limit for batch processing
}

export class ReGenerateTopicHistoryTaskRunner {
 

  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(taskProcess: TaskProcess): Promise<void> {
    const startTime = Date.now();
    const customerId = taskProcess.customerId;

    // Get customer to determine tier-based limits
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      this.logger.error(`Customer with ID ${customerId} not found`);
      return;
    }

    const maxTopicsPer24h = TierLimits.getMaxTopicsPer24hForTier(customer.tier);
    
    const config: ReGenerateTopicHistoryConfig = { 
      maxTopicsPer24h,
      maxTopicsToProcess: 50, // Limit batch size for Vercel
    };

    this.logger.info(`Customer ${customerId} has ${customer.tier} tier with ${maxTopicsPer24h} topics per 24h limit`, {
      customerId,
      tier: customer.tier,
      maxTopicsPer24h
    });

    
    // Get all scheduled GENERATE_TOPIC_HISTORY tasks not processed for the customerId in the last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allCustomerTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      dateFrom: twentyFourHoursAgo,
    });

    this.logger.info(`Found ${allCustomerTasks.length} tasks for customer ${customerId} in the last 24h`, {
      customerId,
      dateFrom: twentyFourHoursAgo,
      taskCount: allCustomerTasks.length
    });

    const generateTasks = allCustomerTasks ? allCustomerTasks.filter(task => task.type === TaskProcess.GENERATE_TOPIC_HISTORY) : [];

    this.logger.info(`Found ${generateTasks.length} generate tasks for customer ${customerId} in the last 24h`, {
      customerId,
      dateFrom: twentyFourHoursAgo,
      taskCount: generateTasks.length
    });
    
    const pendingTasksCount = generateTasks.filter(task => task.status === 'pending').length;

    this.logger.info(`Found ${pendingTasksCount} pending tasks for customer ${customerId} in the last 24h`, {
      customerId,
      dateFrom: twentyFourHoursAgo,
      taskCount: pendingTasksCount
    });
    
    if (pendingTasksCount < config.maxTopicsPer24h) {
      this.logger.info(`Customer ${customerId} has less than ${config.maxTopicsPer24h} pending tasks, generating more`, {
        customerId,
        maxTopicsPer24h: config.maxTopicsPer24h,
        pendingTasksCount
      });

      // Define how many topics are needed to be generated to reach the maxTopicsPer24h
      const topicsNeeded = config.maxTopicsPer24h - pendingTasksCount;
      
      // Get topics with optimized batch query to avoid N+1 problem
      const topics = await this.topicRepository.findByCustomerId(customerId);
      
      // Limit the number of topics to process to prevent timeout
      const limitedTopics = topics.slice(0, config.maxTopicsToProcess);
      
      if (limitedTopics.length === 0) {
        this.logger.info(`No topics found for customer ${customerId}`);
        return;
      }

      // Batch query for topic history counts to avoid N+1 problem
      const topicsWithHistoryCount = await this.getTopicsWithHistoryCountBatch(limitedTopics);
      
      // Sort topics by history count (ascending) and take the ones needed
      const topicsToProcess = topicsWithHistoryCount
        .sort((a, b) => a.historyCount - b.historyCount)
        .slice(0, topicsNeeded)
        .map(item => item.topic);
      
      // Get the last SEND_TOPIC_HISTORY task to calculate the next schedule time
      const sendTasks = allCustomerTasks ? allCustomerTasks.filter(task => 
        task.type === TaskProcess.SEND_TOPIC_HISTORY
      ) : [];
      const lastSendTask = sendTasks.length > 0 
        ? sendTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;
      
      const nextScheduleTime = lastSendTask 
        ? new Date(lastSendTask.createdAt.getTime() + 24 * 60 * 60 * 1000) // +24 hours
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 24h from now
      
      // Schedule new GENERATE_TOPIC_HISTORY tasks for the selected topics
      await this.scheduleTasksBatch(topicsToProcess, customerId, nextScheduleTime);
      
    } else {
      // If the customer has more than maxTopicsPer24h tasks, just print an info message
      this.logger.info(`Customer ${customerId} already has ${pendingTasksCount} pending tasks, which meets the maximum limit of ${config.maxTopicsPer24h} topics per 24h`);
    }
    
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info(`ReGenerateTopicHistoryTaskRunner completed for customer ${customerId}`, {
      customerId,
      executionTimeMs: totalExecutionTime,
    });
  }

  /**
   * Batch query to get topic history counts efficiently
   */
  private async getTopicsWithHistoryCountBatch(topics: Topic[]): Promise<Array<{ topic: Topic; historyCount: number }>> {
    try {
      // Use concurrency limit to avoid overwhelming the database
      const concurrencyLimit = 5; // Limit concurrent database calls
      const results: Array<{ topic: Topic; historyCount: number }> = [];
      
      for (let i = 0; i < topics.length; i += concurrencyLimit) {
        const batch = topics.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(
          batch.map(async (topic) => {
            const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
            return { topic, historyCount: histories.length };
          })
        );
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      this.logger.error('Error getting topic history counts', error instanceof Error ? error : new Error(String(error)));
      // Return topics with 0 history count as fallback
      return topics.map(topic => ({ topic, historyCount: 0 }));
    }
  }

  /**
   * Batch schedule tasks to reduce database calls
   */
  private async scheduleTasksBatch(topics: Topic[], customerId: string, nextScheduleTime: Date): Promise<void> {
    try {
      const tasksToCreate = topics.map(topic => {
        this.logger.info(`Scheduling GENERATE_TOPIC_HISTORY task for topic ${topic.id} at ${nextScheduleTime}`);
        return new TaskProcess(
          topic.id, // entityId
          customerId,
          TaskProcess.GENERATE_TOPIC_HISTORY,
          'pending',
          undefined, // id will be auto-generated
          undefined, // errorMsg
          nextScheduleTime, // scheduledTo
          undefined // processAt
        );
      });

      // Save tasks individually but with better error handling
      for (const task of tasksToCreate) {
        try {
          await this.taskProcessRepository.save(task);
        } catch (error) {
          this.logger.error(`Failed to save task for topic ${task.entityId}`, error instanceof Error ? error : new Error(String(error)));
          // Continue with other tasks even if one fails
        }
      }

      this.logger.info(`Scheduled ${tasksToCreate.length} GENERATE_TOPIC_HISTORY tasks for customer ${customerId}`);
    } catch (error) {
      this.logger.error('Error scheduling tasks', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
