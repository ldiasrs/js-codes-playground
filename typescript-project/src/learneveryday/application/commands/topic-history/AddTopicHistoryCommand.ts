import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { AddTopicHistoryFeature, AddTopicHistoryFeatureData } from '../../../domain/topic-history/features/AddTopicHistoryFeature';
import { TYPES } from '../../../infrastructure/di/types';

export interface AddTopicHistoryCommandData {
  topicId: string;
  content: string;
}

@injectable()
export class AddTopicHistoryCommand extends BaseCommand<TopicHistoryDTO> {
  constructor(
    private readonly data: AddTopicHistoryCommandData,
    @inject(TYPES.AddTopicHistoryFeature) private readonly addTopicHistoryFeature: AddTopicHistoryFeature
  ) {
    super();
  }

  async execute(): Promise<TopicHistoryDTO> {
    // Convert command data to feature data
    const featureData: AddTopicHistoryFeatureData = {
      topicId: this.data.topicId,
      content: this.data.content
    };

    // Execute the feature
    const topicHistory = await this.addTopicHistoryFeature.execute(featureData);

    // Convert result to DTO
    return TopicHistoryDTOMapper.toDTO(topicHistory);
  }
} 