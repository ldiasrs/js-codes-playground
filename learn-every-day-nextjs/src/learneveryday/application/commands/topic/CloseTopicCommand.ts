import { BaseCommand } from '../Command';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';
import { CloseTopicFeature, CloseTopicFeatureData } from '../../../domain/topic/usecase/CloseTopicFeature';

export interface CloseTopicCommandData {
  id: string;
}

export class CloseTopicCommand extends BaseCommand<TopicDTO, CloseTopicCommandData> {
  constructor(
    private readonly closeTopicFeature: CloseTopicFeature
  ) {
    super();
  }

  async execute(data: CloseTopicCommandData): Promise<TopicDTO> {
    // Convert command data to feature data
    const featureData: CloseTopicFeatureData = {
      id: data.id
    };

    // Execute the feature
    const result = await this.closeTopicFeature.execute(featureData);

    // Convert result to DTO
    return TopicDTOMapper.toDTO(result);
  }
} 