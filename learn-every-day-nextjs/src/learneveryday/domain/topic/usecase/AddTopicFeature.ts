import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TierLimits } from '../../shared/TierLimits';
import { DomainError } from '../../shared';

export interface AddTopicFeatureData {
  customerId: string;
  subject: string;
}

export class AddTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the AddTopic feature with validation
   * @param data The data containing customerId and subject
   * @returns Promise<Topic> The created topic
   * @throws Error if customer doesn't exist, topic already exists, or tier limit exceeded
   */
  async execute(data: AddTopicFeatureData): Promise<Topic> {
    const { customerId, subject } = data;

    // Step 1: Verify customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new DomainError(DomainError.CUSTOMER_NOT_FOUND, `Customer with ID ${customerId} not found`);
    }

    // Step 2: Check tier-based topic limits
    const currentTopicCount = await this.topicRepository.countByCustomerId(customerId);
    const canAddMore = TierLimits.canAddMoreTopics(customer.tier, currentTopicCount);
    
    if (!canAddMore) {
      const maxTopics = TierLimits.getMaxTopicsForTier(customer.tier);
      throw new DomainError(
        DomainError.TOPIC_LIMIT_REACHED,
        `Customer ${customer.customerName} (${customer.tier} tier) has reached the maximum limit of ${maxTopics} topics. ` +
        `Current topics: ${currentTopicCount}. Please upgrade your tier to add more topics.`
      );
    }

    // Step 3: Check if topic with same subject already exists for this customer
    const topicExists = await this.topicRepository.existsByCustomerIdAndSubject(customerId, subject);

    if (topicExists) {
      throw new DomainError(DomainError.TOPIC_ALREADY_EXISTS, `Topic with subject "${subject}" already exists for customer ${customer.customerName}`);
    }

    // Step 4: Create and save the new topic
    const newTopic = new Topic(customerId, subject);
    const savedTopic = await this.topicRepository.save(newTopic);

    this.logger.info(`Created topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      subject: savedTopic.subject,
      customerTier: customer.tier,
      topicsCount: currentTopicCount + 1
    });

    // Step 5: Create and save a new topic-history-generation task
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes()); // Schedule for immediate execution
    
    const newTaskProcess = new TaskProcess(
      savedTopic.id, // Use the topic ID as entityId
      customerId,
      TaskProcess.GENERATE_TOPIC_HISTORY,
      'pending',
      undefined, // id will be auto-generated
      undefined, // errorMsg
      new Date()
    );

    // Save the new task process
    await this.taskProcessRepository.save(newTaskProcess);

    this.logger.info(`Scheduled topic history generation task for topic ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: customerId,
      scheduledTime: scheduledTime.toISOString(),
      taskType: TaskProcess.GENERATE_TOPIC_HISTORY
    });

    return savedTopic;
  }
} 