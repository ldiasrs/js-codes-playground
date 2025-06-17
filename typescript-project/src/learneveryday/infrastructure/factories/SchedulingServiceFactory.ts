import { SchedulingService } from '../../domain/scheduling/services/SchedulingService';
import { SendLastTopicHistoryTask } from '../../domain/scheduling/tasks/SendLastTopicHistoryTask';
import { NedbScheduledTaskRepository } from '../adapters/NedbScheduledTaskRepository';
import { NedbCustomerRepository } from '../adapters/NedbCustomerRepository';
import { NedbTopicHistoryRepository } from '../adapters/NedbTopicHistoryRepository';
import { SendTopicHistoryFeature } from '../../domain/topic-history/features/SendTopicHistoryFeature';
import { EmailSenderFactory } from './EmailSenderFactory';

export class SchedulingServiceFactory {
  /**
   * Creates a scheduling service with all necessary dependencies and task executors
   * @param dataDir The directory where data files are stored
   * @returns SchedulingService instance
   */
  static create(dataDir: string): SchedulingService {
    // Initialize repositories (they now use centralized database manager)
    const scheduledTaskRepository = new NedbScheduledTaskRepository();
    const customerRepository = new NedbCustomerRepository();
    const topicHistoryRepository = new NedbTopicHistoryRepository();

    // Initialize features
    const sendTopicHistoryByEmailPort = EmailSenderFactory.createNodemailerSender();
    const sendTopicHistoryFeature = new SendTopicHistoryFeature(sendTopicHistoryByEmailPort);

    // Create scheduling service
    const schedulingService = new SchedulingService(scheduledTaskRepository);

    // Register task executors
    const sendLastTopicHistoryTask = new SendLastTopicHistoryTask(
      customerRepository,
      topicHistoryRepository,
      sendTopicHistoryFeature
    );

    schedulingService.registerTaskExecutor('SendLastTopicHistory', sendLastTopicHistoryTask);

    return schedulingService;
  }

  /**
   * Creates a scheduling service with custom repositories
   * @param scheduledTaskRepository Custom scheduled task repository
   * @param customerRepository Custom customer repository
   * @param topicHistoryRepository Custom topic history repository
   * @param sendTopicHistoryFeature Custom send topic history feature
   * @returns SchedulingService instance
   */
  static createWithCustomDependencies(
    scheduledTaskRepository: any,
    customerRepository: any,
    topicHistoryRepository: any,
    sendTopicHistoryFeature: SendTopicHistoryFeature
  ): SchedulingService {
    // Create scheduling service
    const schedulingService = new SchedulingService(scheduledTaskRepository);

    // Register task executors
    const sendLastTopicHistoryTask = new SendLastTopicHistoryTask(
      customerRepository,
      topicHistoryRepository,
      sendTopicHistoryFeature
    );

    schedulingService.registerTaskExecutor('SendLastTopicHistory', sendLastTopicHistoryTask);

    return schedulingService;
  }
} 