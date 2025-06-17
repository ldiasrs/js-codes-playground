import { SchedulingService } from '../../domain/scheduling/services/SchedulingService';
import { SendLastTopicHistoryTask } from '../../domain/scheduling/tasks/SendLastTopicHistoryTask';
import { GenerateTopicHistoriesForOldTopicsTask } from '../../domain/scheduling/tasks/GenerateTopicHistoriesForOldTopicsTask';
import { NedbScheduledTaskRepository } from '../adapters/NedbScheduledTaskRepository';
import { NedbCustomerRepository } from '../adapters/NedbCustomerRepository';
import { NedbTopicRepository } from '../adapters/NedbTopicRepository';
import { NedbTopicHistoryRepository } from '../adapters/NedbTopicHistoryRepository';
import { SendTopicHistoryFeature } from '../../domain/topic-history/features/SendTopicHistoryFeature';
import { GenerateTopicHistoriesForOldTopicsFeature } from '../../domain/topic-history/features/GenerateTopicHistoriesForOldTopicsFeature';
import { GenerateTopicHistoryFeature } from '../../domain/topic-history/features/GenerateTopicHistoryFeature';
import { EmailSenderFactory } from './EmailSenderFactory';
import { TopicHistoryGeneratorFactory } from './TopicHistoryGeneratorFactory';

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
    const topicRepository = new NedbTopicRepository();
    const topicHistoryRepository = new NedbTopicHistoryRepository();

    // Initialize features
    const sendTopicHistoryByEmailPort = EmailSenderFactory.createNodemailerSender();
    const sendTopicHistoryFeature = new SendTopicHistoryFeature(sendTopicHistoryByEmailPort);
    
    // Create the generate topic history feature manually
    const generateTopicHistoryPort = TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv();
    const generateTopicHistoryFeature = new GenerateTopicHistoryFeature(
      topicRepository,
      topicHistoryRepository,
      generateTopicHistoryPort
    );
    
    // Create the generate topic histories for old topics feature manually
    const generateTopicHistoriesForOldTopicsFeature = new GenerateTopicHistoriesForOldTopicsFeature(
      topicRepository,
      generateTopicHistoryFeature
    );

    // Create scheduling service
    const schedulingService = new SchedulingService(scheduledTaskRepository);

    // Register task executors
    const sendLastTopicHistoryTask = new SendLastTopicHistoryTask(
      customerRepository,
      topicHistoryRepository,
      sendTopicHistoryFeature
    );

    const generateTopicHistoriesForOldTopicsTask = new GenerateTopicHistoriesForOldTopicsTask(
      generateTopicHistoriesForOldTopicsFeature
    );

    schedulingService.registerTaskExecutor('SendLastTopicHistory', sendLastTopicHistoryTask);
    schedulingService.registerTaskExecutor('GenerateTopicHistoriesForOldTopics', generateTopicHistoriesForOldTopicsTask);

    return schedulingService;
  }

  /**
   * Creates a scheduling service with custom repositories
   * @param scheduledTaskRepository Custom scheduled task repository
   * @param customerRepository Custom customer repository
   * @param topicRepository Custom topic repository
   * @param topicHistoryRepository Custom topic history repository
   * @param sendTopicHistoryFeature Custom send topic history feature
   * @param generateTopicHistoriesForOldTopicsFeature Custom generate topic histories feature
   * @returns SchedulingService instance
   */
  static createWithCustomDependencies(
    scheduledTaskRepository: any,
    customerRepository: any,
    topicRepository: any,
    topicHistoryRepository: any,
    sendTopicHistoryFeature: SendTopicHistoryFeature,
    generateTopicHistoriesForOldTopicsFeature: GenerateTopicHistoriesForOldTopicsFeature
  ): SchedulingService {
    // Create scheduling service
    const schedulingService = new SchedulingService(scheduledTaskRepository);

    // Register task executors
    const sendLastTopicHistoryTask = new SendLastTopicHistoryTask(
      customerRepository,
      topicHistoryRepository,
      sendTopicHistoryFeature
    );

    const generateTopicHistoriesForOldTopicsTask = new GenerateTopicHistoriesForOldTopicsTask(
      generateTopicHistoriesForOldTopicsFeature
    );

    schedulingService.registerTaskExecutor('SendLastTopicHistory', sendLastTopicHistoryTask);
    schedulingService.registerTaskExecutor('GenerateTopicHistoriesForOldTopics', generateTopicHistoriesForOldTopicsTask);

    return schedulingService;
  }
} 