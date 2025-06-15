import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GenerateTopicHistoryFeature, GenerateTopicHistoryFeatureData } from '../../../domain/topic-history/features/GenerateTopicHistoryFeature';

export interface GenerateTopicHistoryCommandData {
  topicId: string;
}

export class GenerateTopicHistoryCommand extends BaseCommand<TopicHistoryDTO> {
  constructor(
    private readonly data: GenerateTopicHistoryCommandData,
    private readonly generateTopicHistoryFeature: GenerateTopicHistoryFeature
  ) {
    super();
  }

  async execute(): Promise<TopicHistoryDTO> {
    // Convert command data to feature data
    const featureData: GenerateTopicHistoryFeatureData = {
      topicId: this.data.topicId
    };

    // Execute the feature
    const topicHistory = await this.generateTopicHistoryFeature.execute(featureData);

    // Convert result to DTO
    return TopicHistoryDTOMapper.toDTO(topicHistory);
  }
} 