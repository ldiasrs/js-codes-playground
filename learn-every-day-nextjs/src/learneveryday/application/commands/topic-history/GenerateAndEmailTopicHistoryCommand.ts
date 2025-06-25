import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GenerateAndEmailTopicHistoryFeature, GenerateAndEmailTopicHistoryFeatureData } from '../../../domain/topic-history/usecase/GenerateAndEmailTopicHistoryFeature';

export interface GenerateAndEmailTopicHistoryCommandData {
  topicId: string;
  recipientEmail: string;
}

export class GenerateAndEmailTopicHistoryCommand extends BaseCommand<TopicHistoryDTO> {
  constructor(
    private readonly data: GenerateAndEmailTopicHistoryCommandData,
    private readonly generateAndEmailTopicHistoryFeature: GenerateAndEmailTopicHistoryFeature
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
    const result = await this.generateAndEmailTopicHistoryFeature.execute(featureData);

    // Convert result to DTO
    return TopicHistoryDTOMapper.toDTO(result);
  }
} 