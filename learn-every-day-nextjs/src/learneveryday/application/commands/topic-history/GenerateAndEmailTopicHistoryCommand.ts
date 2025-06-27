import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GenerateAndEmailTopicHistoryFeature, GenerateAndEmailTopicHistoryFeatureData } from '../../../domain/topic-history/usecase/GenerateAndEmailTopicHistoryFeature';

export interface GenerateAndEmailTopicHistoryCommandData {
  topicId: string;
  recipientEmail: string;
}

export class GenerateAndEmailTopicHistoryCommand extends BaseCommand<TopicHistoryDTO, GenerateAndEmailTopicHistoryCommandData> {
  constructor(
    private readonly generateAndEmailTopicHistoryFeature: GenerateAndEmailTopicHistoryFeature
  ) {
    super();
  }

  async execute(data: GenerateAndEmailTopicHistoryCommandData): Promise<TopicHistoryDTO> {
    // Convert command data to feature data
    const featureData: GenerateAndEmailTopicHistoryFeatureData = {
      topicId: data.topicId,
      recipientEmail: data.recipientEmail
    };

    // Execute the feature
    const result = await this.generateAndEmailTopicHistoryFeature.execute(featureData);

    // Convert result to DTO
    return TopicHistoryDTOMapper.toDTO(result);
  }
} 