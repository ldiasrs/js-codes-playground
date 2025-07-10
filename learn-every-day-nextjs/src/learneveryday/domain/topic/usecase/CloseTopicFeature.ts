import { Topic } from '../entities/Topic';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';

export interface CloseTopicFeatureData {
  id: string;
}

export class CloseTopicFeature {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the CloseTopic feature with validation
   * @param data The data containing topic id
   * @returns Promise<Topic> The updated topic with closed set to true
   * @throws Error if topic doesn't exist or is already closed
   */
  async execute(data: CloseTopicFeatureData): Promise<Topic> {
    const { id } = data;

    // Step 1: Verify topic exists
    const existingTopic = await this.topicRepository.findById(id);
    if (!existingTopic) {
      throw new Error(`Topic with ID ${id} not found`);
    }

    // Step 2: Check if topic is already closed
    if (existingTopic.closed) {
      throw new Error(`Topic with ID ${id} is already closed`);
    }

    // Step 3: Create updated topic with closed set to true
    const closedTopic = new Topic(
      existingTopic.customerId,
      existingTopic.subject,
      existingTopic.id,
      existingTopic.dateCreated,
      true
    );

    // Step 4: Save the updated topic
    const savedTopic = await this.topicRepository.save(closedTopic);

    // Step 5: Schedule a CLOSE_TOPIC task for cleanup
    await this.scheduleCloseTopicTask(savedTopic);

    this.logger.info(`Closed topic: ${savedTopic.id}`, {
      topicId: savedTopic.id,
      customerId: savedTopic.customerId,
      subject: savedTopic.subject,
      closed: savedTopic.closed
    });

    return savedTopic;
  }

  /**
   * Schedules a CLOSE_TOPIC task for cleanup operations
   * @param topic The closed topic
   */
  private async scheduleCloseTopicTask(topic: Topic): Promise<void> {
    try {
      const closeTopicTask = new TaskProcess(
        topic.id, // entityId
        topic.customerId,
        TaskProcess.CLOSE_TOPIC,
        'pending',
        undefined, // id will be auto-generated
        undefined, // errorMsg
        new Date(), // Schedule for immediate execution
        undefined // processAt
      );

      await this.taskProcessRepository.save(closeTopicTask);

      this.logger.info(`Scheduled CLOSE_TOPIC task for topic ${topic.id}`, {
        topicId: topic.id,
        customerId: topic.customerId,
        taskType: TaskProcess.CLOSE_TOPIC,
        taskId: closeTopicTask.id
      });
    } catch (error) {
      this.logger.error(`Failed to schedule CLOSE_TOPIC task for topic ${topic.id}`, 
        error instanceof Error ? error : new Error(String(error)));
      // Don't throw here as the topic was already closed successfully
    }
  }
} 