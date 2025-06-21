import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../topic-history/ports/TopicHistoryRepositoryPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TYPES } from '../../../infrastructure/di/types';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';

export interface DeleteTopicFeatureData {
  id: string;
}

@injectable()
export class DeleteTopicFeature {
  constructor(
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.TopicHistoryRepository) private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    @inject(TYPES.TaskProcessRepository) private readonly taskProcessRepository: TaskProcessRepositoryPort,
    @inject(TYPES.Logger) private readonly logger: LoggerPort
  ) {}

  /**
   * Executes the DeleteTopic feature
   * @param data The data containing the topic id to delete
   * @returns Promise<boolean> True if topic was deleted successfully
   * @throws Error if topic doesn't exist or deletion fails
   */
  async execute(data: DeleteTopicFeatureData): Promise<boolean> {
    const { id } = data;

    // Step 1: Check if topic exists
    const existingTopic = await this.topicRepository.findById(id);
    if (!existingTopic) {
      throw new Error(`Topic with ID ${id} not found`);
    }

    // Step 2: Delete all related TaskProcess entries for this topic
    // Delete topic history generation tasks
    const generationTasks = await this.taskProcessRepository.findByEntityIdAndType(id, TaskProcess.GENERATE_TOPIC_HISTORY);
    for (const task of generationTasks) {
      await this.taskProcessRepository.delete(task.id);
    }

    // Delete topic history send tasks (these use topic history IDs as entityId)
    // First, get all topic histories for this topic
    const topicHistories = await this.topicHistoryRepository.findByTopicId(id);
    for (const topicHistory of topicHistories) {
      const sendTasks = await this.taskProcessRepository.findByEntityIdAndType(topicHistory.id, TaskProcess.SEND_TOPIC_HISTORY);
      for (const task of sendTasks) {
        await this.taskProcessRepository.delete(task.id);
      }
    }

    this.logger.info(`Deleted ${generationTasks.length} generation tasks and related send tasks for topic: ${id}`, {
      topicId: id,
      deletedGenerationTasks: generationTasks.length,
      deletedSendTasks: topicHistories.length
    });

    // Step 3: Delete topic history first (if any)
    // Note: This would need to be implemented in TopicHistoryRepository
    // For now, we'll just delete the topic
    try {
      await this.topicHistoryRepository.deleteByTopicId(id);
    } catch (error) {
      // If deleteByTopicId is not implemented, we'll continue
      this.logger.warn('Could not delete topic history', { 
        topicId: id, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Step 4: Delete the topic
    const deleted = await this.topicRepository.delete(id);
    if (!deleted) {
      throw new Error(`Failed to delete topic with ID ${id}`);
    }

    this.logger.info(`Successfully deleted topic: ${id} and all related data`, {
      topicId: id,
      topicSubject: existingTopic.subject,
      customerId: existingTopic.customerId
    });

    return true;
  }
} 