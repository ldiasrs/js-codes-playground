import { TaskProcess } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { TopicRepositoryPort } from "../../topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { LoggerPort } from "../../shared/ports/LoggerPort";

export interface ReGenerateTopicHistoryConfig {
  maxTopicsPer24h: number; // 1 or 3
}

export class ReGenerateTopicHistoryTaskRunner {
  private config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 1 };

  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  setConfig(config: ReGenerateTopicHistoryConfig): void {
    this.config = config;
  }

  async execute(taskProcess: TaskProcess): Promise<void> {
    const customerId = taskProcess.customerId;
    
    // Get all scheduled GENERATE_TOPIC_HISTORY tasks not processed for the customerId in the last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allCustomerTasks = await this.taskProcessRepository.searchProcessedTasks({
      customerId,
      dateFrom: twentyFourHoursAgo,
    });

    const generateTasks = allCustomerTasks ? allCustomerTasks.filter(task => task.type === TaskProcess.GENERATE_TOPIC_HISTORY) : [];
    
    const pendingTasksCount = generateTasks.filter(task => task.status === 'pending').length
    
    if (pendingTasksCount < this.config.maxTopicsPer24h) {
      // Define how many topics are needed to be generated to reach the maxTopicsPer24h
      const topicsNeeded = this.config.maxTopicsPer24h - pendingTasksCount;
      
      // Get topics with less topic histories
      const topics = await this.topicRepository.findByCustomerId(customerId);
      const topicsWithHistoryCount = await Promise.all(
        topics.map(async (topic) => {
          const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
          return { topic, historyCount: histories.length };
        })
      );
      
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
      for (const topic of topicsToProcess) {
        const newTask = new TaskProcess(
          topic.id, // entityId
          customerId,
          TaskProcess.GENERATE_TOPIC_HISTORY,
          'pending',
          undefined, // id will be auto-generated
          undefined, // errorMsg
          nextScheduleTime, // scheduledTo
          undefined // processAt
        );
        
        await this.taskProcessRepository.save(newTask);
        this.logger.info(`Scheduled GENERATE_TOPIC_HISTORY task for topic ${topic.id} at ${nextScheduleTime}`);
      }
    } else {
      // If the customer has more than maxTopicsPer24h tasks, just print an info message
      this.logger.info(`Customer ${customerId} already has ${pendingTasksCount} pending tasks, which meets the maximum limit of ${this.config.maxTopicsPer24h} topics per 24h`);
    }
  }
}
