import { GenerateTopicHistoryPort } from '../../../topic/application/ports/GenerateTopicHistoryPort';
import { TaskProcessRepositoryPort } from '../../ports/TaskProcessRepositoryPort';
import { TaskProcessFactory } from '../../domain/factories/TaskProcessFactory';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';

/**
 * Implements TopicHistorySchedulingPort from the topic feature.
 * This service translates topic history scheduling requests into taskprocess domain operations.
 */
export class TopicHistorySchedulingService implements GenerateTopicHistoryPort {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async generate(topicId: string, customerId: string): Promise<void> {
    const taskProcess = TaskProcessFactory.createTopicHistoryGenerationTask(topicId, customerId);

    await this.taskProcessRepository.save(taskProcess);

    this.logger.info(`Scheduled topic history generation for topic ${topicId}`, {
      topicId,
      customerId,
      taskType: taskProcess.type
    });
  }
}

