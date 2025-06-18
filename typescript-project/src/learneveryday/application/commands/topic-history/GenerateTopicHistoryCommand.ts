import 'reflect-metadata';
import { injectable, inject, unmanaged } from 'inversify';
import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GenerateTopicHistoryTaskRunner } from '../../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { TopicHistoryRepositoryPort } from '../../../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { TaskProcess } from '../../../domain/taskprocess/entities/TaskProcess';
import { TYPES } from '../../../infrastructure/di/types';

export interface GenerateTopicHistoryCommandData {
  topicId: string;
}

@injectable()
export class GenerateTopicHistoryCommand extends BaseCommand<TopicHistoryDTO> {
  constructor(
    @unmanaged() private readonly data: GenerateTopicHistoryCommandData,
    @inject(TYPES.GenerateTopicHistoryTaskRunner) private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    @inject(TYPES.TopicHistoryRepository) private readonly topicHistoryRepository: TopicHistoryRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<TopicHistoryDTO> {
    // Create a TaskProcess instance for the runner
    const taskProcess = new TaskProcess(
      this.data.topicId,
      'topic-history-generation',
      'running'
    );

    // Execute the task runner
    await this.generateTopicHistoryTaskRunner.execute(taskProcess);

    // Get the latest generated topic history
    const topicHistories = await this.topicHistoryRepository.findByTopicId(this.data.topicId);
    const latestTopicHistory = topicHistories.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    if (!latestTopicHistory) {
      throw new Error(`Failed to generate topic history for topic ID ${this.data.topicId}`);
    }

    // Convert result to DTO
    return TopicHistoryDTOMapper.toDTO(latestTopicHistory);
  }
} 