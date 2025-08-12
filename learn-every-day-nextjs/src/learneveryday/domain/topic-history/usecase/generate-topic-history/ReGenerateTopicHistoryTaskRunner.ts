import { CustomerRepositoryPort, Customer } from "@/learneveryday/domain/customer";
import { LoggerPort, TierLimits } from "@/learneveryday/domain/shared";
import { TaskProcess, TaskProcessRepositoryPort } from "@/learneveryday/domain/taskprocess";
import { Topic } from "@/learneveryday/domain/topic/entities/Topic";
import { TopicRepositoryPort } from "@/learneveryday/domain/topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../../ports/TopicHistoryRepositoryPort";

export interface ReGenerateTopicHistoryConfig {
  maxTopicsPer24h: number; // 1 or 3 or 5 depending on tier
  maxTopicsToProcess: number; // Limit for batch processing
}

interface TaskAnalysis {
  allTasks: TaskProcess[];
  generateTasks: TaskProcess[];
  pendingTasksCount: number;
  lastSendTask: TaskProcess | null;
}

interface TopicWithHistoryCount {
  topic: Topic;
  historyCount: number;
}

export class ReGenerateTopicHistoryTaskRunner {
  private static readonly BATCH_SIZE_LIMIT = 50;
  private static readonly CONCURRENCY_LIMIT = 5;
  private static readonly HOURS_24_IN_MS = 24 * 60 * 60 * 1000;
  private static readonly MAX_HISTORIES_BEFORE_CLOSE = 5;

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

    try {
      const customer = await this.validateAndGetCustomer(customerId);
      if (!customer) return;

      const config = this.createConfiguration(customer);
      const taskAnalysis = await this.analyzeExistingTasks(customerId);

      if (this.shouldGenerateMoreTasks(taskAnalysis, config)) {
        await this.generateAdditionalTasks(customerId, taskAnalysis, config);
      } else {
        this.logTaskLimitReached(customerId, taskAnalysis.pendingTasksCount, config.maxTopicsPer24h);
      }

      this.logExecutionCompletion(customerId, startTime);
    } catch (error) {
      this.logger.error(`Failed to execute ReGenerateTopicHistoryTaskRunner for customer ${customerId}`, 
        error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async validateAndGetCustomer(customerId: string): Promise<Customer | null> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      this.logger.error(`Customer with ID ${customerId} not found`, undefined, {
        customerId: customerId
      });
      return null;
    }
    return customer;
  }

  private createConfiguration(customer: Customer): ReGenerateTopicHistoryConfig {
    const maxTopicsPer24h = TierLimits.getMaxTopicsPer24hForTier(customer.tier);
    
    this.logger.info(`Customer ${customer.id} has ${customer.tier} tier with ${maxTopicsPer24h} topics per 24h limit`, {
      customerId: customer.id,
      tier: customer.tier,
      maxTopicsPer24h
    });

    return {
      maxTopicsPer24h,
      maxTopicsToProcess: ReGenerateTopicHistoryTaskRunner.BATCH_SIZE_LIMIT,
    };
  }

  private async analyzeExistingTasks(customerId: string): Promise<TaskAnalysis> {
    const twentyFourHoursAgo = new Date(Date.now() - ReGenerateTopicHistoryTaskRunner.HOURS_24_IN_MS);
    const allTasks = await this.getTasksFromLast24Hours(customerId, twentyFourHoursAgo);
    
    const generateTasks = this.filterGenerateTasks(allTasks);
    const pendingTasksCount = this.countPendingTasks(generateTasks);
    const lastSendTask = this.findLastSendTask(allTasks);

    this.logTaskAnalysis(customerId, allTasks.length, generateTasks.length, pendingTasksCount);

    return {
      allTasks,
      generateTasks,
      pendingTasksCount,
      lastSendTask
    };
  }

  private async getTasksFromLast24Hours(customerId: string, twentyFourHoursAgo: Date): Promise<TaskProcess[]> {
    const tasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      dateFrom: twentyFourHoursAgo,
    });

    this.logger.info(`Found ${tasks.length} tasks for customer ${customerId} in the last 24h`, {
      customerId,
      dateFrom: twentyFourHoursAgo,
      taskCount: tasks.length
    });

    return tasks || [];
  }

  private filterGenerateTasks(allTasks: TaskProcess[]): TaskProcess[] {
    return allTasks.filter(task => task.type === TaskProcess.GENERATE_TOPIC_HISTORY);
  }

  private countPendingTasks(generateTasks: TaskProcess[]): number {
    return generateTasks.filter(task => task.status === 'pending').length;
  }

  private findLastSendTask(allTasks: TaskProcess[]): TaskProcess | null {
    const sendTasks = allTasks.filter(task => task.type === TaskProcess.SEND_TOPIC_HISTORY);
    
    if (sendTasks.length === 0) return null;
    
    return sendTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  private logTaskAnalysis(customerId: string, totalTasks: number, generateTasks: number, pendingTasks: number): void {
    this.logger.info(`Found ${generateTasks} generate tasks for customer ${customerId} in the last 24h`, {
      customerId,
      taskCount: generateTasks
    });

    this.logger.info(`Found ${pendingTasks} pending tasks for customer ${customerId} in the last 24h`, {
      customerId,
      taskCount: pendingTasks
    });
  }

  private shouldGenerateMoreTasks(taskAnalysis: TaskAnalysis, config: ReGenerateTopicHistoryConfig): boolean {
    return taskAnalysis.pendingTasksCount < config.maxTopicsPer24h;
  }

  private async generateAdditionalTasks(
    customerId: string, 
    taskAnalysis: TaskAnalysis, 
    config: ReGenerateTopicHistoryConfig
  ): Promise<void> {
    this.logGeneratingMoreTasks(customerId, config.maxTopicsPer24h, taskAnalysis.pendingTasksCount);

    const topicsNeeded = this.calculateTopicsNeeded(config.maxTopicsPer24h, taskAnalysis.pendingTasksCount);
    const topics = await this.getCustomerTopics(customerId);
    
    if (topics.length === 0) {
      this.logger.info(`No topics found for customer ${customerId}`, {
        customerId: customerId
      });
      return;
    }

    const selectedTopics = await this.selectTopicsToProcess(topics, topicsNeeded, config.maxTopicsToProcess);
    const nextScheduleTime = this.calculateNextScheduleTime(taskAnalysis.lastSendTask);
    
    await this.scheduleTasksBatch(selectedTopics, customerId, nextScheduleTime);
  }

  private logGeneratingMoreTasks(customerId: string, maxTopics: number, pendingCount: number): void {
    this.logger.info(`Customer ${customerId} has less than ${maxTopics} pending tasks, generating more`, {
      customerId,
      maxTopicsPer24h: maxTopics,
      pendingTasksCount: pendingCount
    });
  }

  private calculateTopicsNeeded(maxTopicsPer24h: number, pendingTasksCount: number): number {
    return maxTopicsPer24h - pendingTasksCount;
  }

  private async getCustomerTopics(customerId: string): Promise<Topic[]> {
    return await this.topicRepository.findByCustomerId(customerId);
  }

  private async selectTopicsToProcess(
    topics: Topic[], 
    topicsNeeded: number, 
    maxTopicsToProcess: number
  ): Promise<Topic[]> {
    // Filter out closed topics
    const openTopics = topics.filter(topic => !topic.closed);
    
    if (openTopics.length === 0) {
      this.logger.info('No open topics available for processing', {
        customerId: "not-provided"
      });
      return [];
    }

    const limitedTopics = openTopics.slice(0, maxTopicsToProcess);
    const topicsWithHistoryCount = await this.getTopicsWithHistoryCountBatch(limitedTopics);
    
    // Filter out topics that already have the maximum number of histories
    const eligibleTopics = topicsWithHistoryCount.filter(
      item => item.historyCount <= ReGenerateTopicHistoryTaskRunner.MAX_HISTORIES_BEFORE_CLOSE
    );
    
    return eligibleTopics
      .sort((a, b) => a.historyCount - b.historyCount)
      .slice(0, topicsNeeded)
      .map(item => item.topic);
  }

  private calculateNextScheduleTime(lastSendTask: TaskProcess | null): Date {
    if (lastSendTask) {
      return new Date(lastSendTask.createdAt.getTime() + ReGenerateTopicHistoryTaskRunner.HOURS_24_IN_MS);
    }
    return new Date(Date.now() + ReGenerateTopicHistoryTaskRunner.HOURS_24_IN_MS);
  }

  private logTaskLimitReached(customerId: string, pendingCount: number, maxTopics: number): void {
    this.logger.info(`Customer ${customerId} already has ${pendingCount} pending tasks, which meets the maximum limit of ${maxTopics} topics per 24h`);
  }

  private logExecutionCompletion(customerId: string, startTime: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info(`ReGenerateTopicHistoryTaskRunner completed for customer ${customerId}`, {
      customerId,
      executionTimeMs: totalExecutionTime,
    });
  }

  private async getTopicsWithHistoryCountBatch(topics: Topic[]): Promise<TopicWithHistoryCount[]> {
    try {
      const results: TopicWithHistoryCount[] = [];
      
      for (let i = 0; i < topics.length; i += ReGenerateTopicHistoryTaskRunner.CONCURRENCY_LIMIT) {
        const batch = topics.slice(i, i + ReGenerateTopicHistoryTaskRunner.CONCURRENCY_LIMIT);
        const batchResults = await this.processTopicHistoryBatch(batch);
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      this.logger.error('Error getting topic history counts', error instanceof Error ? error : new Error(String(error)), {
        customerId: "not-provided"
      });
      return this.createFallbackTopicsWithZeroHistory(topics);
    }
  }

  private async processTopicHistoryBatch(topics: Topic[]): Promise<TopicWithHistoryCount[]> {
    return await Promise.all(
      topics.map(async (topic) => {
        const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
        return { topic, historyCount: histories.length };
      })
    );
  }

  private createFallbackTopicsWithZeroHistory(topics: Topic[]): TopicWithHistoryCount[] {
    return topics.map(topic => ({ topic, historyCount: 0 }));
  }

  private async scheduleTasksBatch(topics: Topic[], customerId: string, nextScheduleTime: Date): Promise<void> {
    try {
      const tasksToCreate = this.createTaskProcesses(topics, customerId, nextScheduleTime);
      await this.saveTasksIndividually(tasksToCreate);
      this.logScheduledTasks(tasksToCreate.length, customerId);
    } catch (error) {
      this.logger.error('Error scheduling tasks', error instanceof Error ? error : new Error(String(error)), {
        customerId: customerId
      });
      throw error;
    }
  }

  private createTaskProcesses(topics: Topic[], customerId: string, nextScheduleTime: Date): TaskProcess[] {
    return topics.map(topic => {
      this.logger.info(`Scheduling GENERATE_TOPIC_HISTORY task for topic ${topic.id} at ${nextScheduleTime}`, {
        customerId: customerId,
        topicId: topic.id
      });
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
  }

  private async saveTasksIndividually(tasks: TaskProcess[]): Promise<void> {
    for (const task of tasks) {
      try {
        await this.taskProcessRepository.save(task);
      } catch (error) {
        this.logger.error(`Failed to save task for topic ${task.entityId}`, 
          error instanceof Error ? error : new Error(String(error)), {
            customerId: task.customerId,
            topicId: task.entityId
          });
        // Continue with other tasks even if one fails
      }
    }
  }

  private logScheduledTasks(taskCount: number, customerId: string): void {
    this.logger.info(`Scheduled ${taskCount} GENERATE_TOPIC_HISTORY tasks for customer ${customerId}`);
  }
}
