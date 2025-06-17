import 'reflect-metadata';
import { injectable, inject, unmanaged } from 'inversify';
import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GenerateAndEmailTopicHistoryFeature, GenerateAndEmailTopicHistoryFeatureData } from '../../../domain/topic-history/features/GenerateAndEmailTopicHistoryFeature';
import { TYPES } from '../../../infrastructure/di/types';

export interface GenerateAndEmailTopicHistoryCommandData {
  topicId: string;
  recipientEmail: string;
}

@injectable()
export class GenerateAndEmailTopicHistoryCommand extends BaseCommand<TopicHistoryDTO> {
  constructor(
    @unmanaged() private readonly data: GenerateAndEmailTopicHistoryCommandData,
    @inject(TYPES.GenerateAndEmailTopicHistoryFeature) private readonly generateAndEmailTopicHistoryFeature: GenerateAndEmailTopicHistoryFeature
  ) {
    super();
  }

  async execute(): Promise<TopicHistoryDTO> {
    // Convert command data to feature data
    const featureData: GenerateAndEmailTopicHistoryFeatureData = {
      topicId: this.data.topicId,
      recipientEmail: this.data.recipientEmail
    };

    // Execute the feature
    const topicHistory = await this.generateAndEmailTopicHistoryFeature.execute(featureData);

    // Convert result to DTO
    return TopicHistoryDTOMapper.toDTO(topicHistory);
  }
} 