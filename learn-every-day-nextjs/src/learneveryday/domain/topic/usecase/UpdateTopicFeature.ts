import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';

export interface UpdateTopicFeatureData {
  id: string;
  subject: string;
}

export class UpdateTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the UpdateTopic feature with validation
   * @param data The data containing id and new subject
   * @returns Promise<Topic> The updated topic
   * @throws Error if topic doesn't exist or subject is invalid
   */
  async execute(data: UpdateTopicFeatureData): Promise<Topic> {
    const { id, subject } = data;

    // Step 1: Verify topic exists
    const existingTopic = await this.topicRepository.findById(id);
    if (!existingTopic) {
      throw new Error(`Topic with ID ${id} not found`);
    }

    // Step 2: Validate subject
    if (!subject || subject.trim().length === 0) {
      throw new Error('Topic subject cannot be empty');
    }

    // Step 3: Check if topic with same subject already exists for this customer
    const topicExists = await this.topicRepository.existsByCustomerIdAndSubject(existingTopic.customerId, subject.trim());

    if (topicExists && existingTopic.subject !== subject.trim()) {
      throw new Error(`Topic with subject "${subject}" already exists for this customer`);
    }

    // Step 4: Create updated topic
    const updatedTopic = new Topic(
      existingTopic.customerId,
      subject.trim(),
      id,
      existingTopic.dateCreated
    );

    // Step 5: Save the updated topic
    const savedTopic = await this.topicRepository.save(updatedTopic);

    this.logger.info(`Updated topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      oldSubject: existingTopic.subject,
      newSubject: savedTopic.subject
    });

    return savedTopic;
  }
} 