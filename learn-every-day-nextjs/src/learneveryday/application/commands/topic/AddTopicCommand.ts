import { BaseCommand } from '../Command';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';
import { AddTopicFeature, AddTopicFeatureData } from '../../../domain/topic/usecase/AddTopicFeature';

export interface AddTopicCommandData {
  customerId: string;
  subject: string;
}

export class AddTopicCommand extends BaseCommand<TopicDTO> {
  constructor(
    private readonly data: AddTopicCommandData,
    private readonly addTopicFeature: AddTopicFeature
  ) {
    super();
  }

  async execute(): Promise<TopicDTO> {
    // Convert command data to feature data
    const featureData: AddTopicFeatureData = {
      customerId: this.data.customerId,
      subject: this.data.subject
    };

    // Execute the feature
    const result = await this.addTopicFeature.execute(featureData);

    // Convert result to DTO
    return TopicDTOMapper.toDTO(result);
  }
} 