import 'reflect-metadata';
import { injectable, inject, unmanaged } from 'inversify';
import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GenerateTopicHistoryTaskRunner } from '../../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { TopicHistoryRepositoryPort } from '../../../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
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
    @inject(TYPES.TopicHistoryRepository) private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<TopicHistoryDTO> {
    // Get the topic to find the customerId
    const topic = await this.topicRepository.findById(this.data.topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${this.data.topicId} not found`);
    }
    
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