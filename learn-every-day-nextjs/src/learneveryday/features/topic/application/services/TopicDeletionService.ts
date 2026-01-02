import { TopicRepositoryPort } from '../ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../../topic-histoy/application/ports/TopicHistoryRepositoryPort';
import { TaskProcessRepositoryPort } from '../../../taskprocess/application/ports/TaskProcessRepositoryPort';
import { TaskProcess } from '../../../taskprocess/domain/TaskProcess';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Application service for orchestrating topic deletion.
 * Handles cascade deletion of related entities (task processes, topic histories).
 */
export class TopicDeletionService {
  constructor(
    private readonly topicRepository: TopicRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  /**
   * Deletes all related entities for a topic (task processes and topic histories).
   * @param topicId The topic ID
   * @returns Promise<void>
   */
  async deleteRelatedEntities(topicId: string): Promise<void> {
    await this.deleteTaskProcesses(topicId);
    await this.deleteTopicHistories(topicId);
  }

  /**
   * Deletes all task processes related to the topic
   * @param topicId The topic ID
   */
  private async deleteTaskProcesses(topicId: string): Promise<void> {
    // Delete topic history generation tasks
    const generationTasks = await this.taskProcessRepository.findByEntityIdAndType(
      topicId,
      TaskProcess.GENERATE_TOPIC_HISTORY
    );
    
    for (const task of generationTasks) {
      await this.taskProcessRepository.delete(task.id);
    }

    // Delete topic history send tasks (these use topic history IDs as entityId)
    const topicHistories = await this.topicHistoryRepository.findByTopicId(topicId);
    for (const topicHistory of topicHistories) {
      const sendTasks = await this.taskProcessRepository.findByEntityIdAndType(
        topicHistory.id,
        TaskProcess.SEND_TOPIC_HISTORY
      );
      for (const task of sendTasks) {
        await this.taskProcessRepository.delete(task.id);
      }
    }

    this.logger.info(`Deleted ${generationTasks.length} generation tasks and related send tasks for topic: ${topicId}`, {
      topicId,
      deletedGenerationTasks: generationTasks.length,
      deletedSendTasks: topicHistories.length
    });
  }

  /**
   * Deletes all topic histories for the topic
   * @param topicId The topic ID
   */
  private async deleteTopicHistories(topicId: string): Promise<void> {
    try {
      await this.topicHistoryRepository.deleteByTopicId(topicId);
    } catch (error) {
      // If deleteByTopicId is not implemented, we'll continue
      this.logger.warn('Could not delete topic history', {
        topicId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}

