import { TopicLifecycleCleanupPort } from '../../../topic/application/ports/TopicLifecycleCleanupPort';
import { TaskProcessRepositoryPort } from '../../ports/TaskProcessRepositoryPort';
import { TaskProcess } from '../TaskProcess';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Implements TopicLifecycleCleanupPort from the topic feature.
 * This service translates topic lifecycle events into taskprocess domain operations.
 */
export class TopicLifecycleCleanupService implements TopicLifecycleCleanupPort {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async cleanupOnDeletion(topicId: string, relatedEntityIds: string[]): Promise<void> {
    await this.deleteTasksForTopic(topicId);
    await this.deleteTasksForRelatedEntities(relatedEntityIds);

    this.logger.info(`Cleaned up tasks for deleted topic ${topicId}`, {
      topicId,
      relatedEntityCount: relatedEntityIds.length
    });
  }

  /**
   * Deletes all tasks related to the topic itself
   * @param topicId The topic ID
   */
  private async deleteTasksForTopic(topicId: string): Promise<void> {
    const generationTasks = await this.taskProcessRepository.findByEntityIdAndType(
      topicId,
      TaskProcess.GENERATE_TOPIC_HISTORY
    );

    for (const task of generationTasks) {
      await this.taskProcessRepository.delete(task.id);
    }

    if (generationTasks.length > 0) {
      this.logger.info(`Deleted ${generationTasks.length} generation tasks for topic ${topicId}`, {
        topicId,
        deletedTasks: generationTasks.length
      });
    }
  }

  /**
   * Deletes all tasks related to topic histories
   * @param relatedEntityIds Array of topic history IDs
   */
  private async deleteTasksForRelatedEntities(relatedEntityIds: string[]): Promise<void> {
    let totalDeleted = 0;

    for (const entityId of relatedEntityIds) {
      const sendTasks = await this.taskProcessRepository.findByEntityIdAndType(
        entityId,
        TaskProcess.SEND_TOPIC_HISTORY
      );

      for (const task of sendTasks) {
        await this.taskProcessRepository.delete(task.id);
        totalDeleted++;
      }
    }

    if (totalDeleted > 0) {
      this.logger.info(`Deleted ${totalDeleted} send tasks for topic histories`, {
        relatedEntityCount: relatedEntityIds.length,
        deletedTasks: totalDeleted
      });
    }
  }
}

