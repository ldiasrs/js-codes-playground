import { BaseCommand } from '../Command';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';
import { AddTopicSimpleFeature, AddTopicSimpleFeatureData } from '../../../domain/feature/AddTopicSimpleFeature';
import { AddTopicFeature } from '../../../domain';

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
    const featureData: AddTopicSimpleFeatureData = {
      customerId: this.data.customerId,
      subject: this.data.subject
    };

    // Execute the feature
    const topic = await this.addTopicFeature.execute(featureData);

    // Convert result to DTO
    return TopicDTOMapper.toDTO(topic);
  }
} 