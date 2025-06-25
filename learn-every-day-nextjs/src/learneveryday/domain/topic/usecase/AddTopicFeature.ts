import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';

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
   * @throws Error if customer doesn't exist or topic already exists
   */
  async execute(data: AddTopicFeatureData): Promise<Topic> {
    const { customerId, subject } = data;

    // Step 1: Verify customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    // Step 2: Check if topic with same subject already exists for this customer
    const topicExists = await this.topicRepository.existsByCustomerIdAndSubject(customerId, subject);

    if (topicExists) {
      throw new Error(`Topic with subject "${subject}" already exists for customer ${customer.customerName}`);
    }

    // Step 3: Create and save the new topic
    const newTopic = new Topic(customerId, subject);
    const savedTopic = await this.topicRepository.save(newTopic);

    this.logger.info(`Created topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      subject: savedTopic.subject
    });

    // Step 4: Create and save a new topic-history-generation task
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