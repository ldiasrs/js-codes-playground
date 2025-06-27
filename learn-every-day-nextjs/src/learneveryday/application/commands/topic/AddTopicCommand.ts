import { BaseCommand } from '../Command';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';
import { AddTopicFeature, AddTopicFeatureData } from '../../../domain/topic/usecase/AddTopicFeature';

export interface AddTopicCommandData {
  customerId: string;
  subject: string;
}

export class AddTopicCommand extends BaseCommand<TopicDTO, AddTopicCommandData> {
  constructor(
    private readonly addTopicFeature: AddTopicFeature
  ) {
    super();
  }

  async execute(data: AddTopicCommandData): Promise<TopicDTO> {
    // Convert command data to feature data
    const featureData: AddTopicFeatureData = {
      customerId: data.customerId,
      subject: data.subject
    };

    // Execute the feature
    const result = await this.addTopicFeature.execute(featureData);

    // Convert result to DTO
    return TopicDTOMapper.toDTO(result);
  }
} 