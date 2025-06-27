import { BaseCommand } from '../Command';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';
import { UpdateTopicFeature, UpdateTopicFeatureData } from '../../../domain/topic/usecase/UpdateTopicFeature';

export interface UpdateTopicCommandData {
  id: string;
  subject: string;
}

export class UpdateTopicCommand extends BaseCommand<TopicDTO> {
  constructor(
    private readonly data: UpdateTopicCommandData,
    private readonly updateTopicFeature: UpdateTopicFeature
  ) {
    super();
  }

  async execute(): Promise<TopicDTO> {
    // Convert command data to feature data
    const featureData: UpdateTopicFeatureData = {
      id: this.data.id,
      subject: this.data.subject
    };

    // Execute the feature
    const result = await this.updateTopicFeature.execute(featureData);

    // Convert result to DTO
    return TopicDTOMapper.toDTO(result);
  }
} 