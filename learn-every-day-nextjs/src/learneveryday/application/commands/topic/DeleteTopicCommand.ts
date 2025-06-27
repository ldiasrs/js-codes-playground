import { BaseCommand } from '../Command';
import { DeleteTopicFeature, DeleteTopicFeatureData } from '../../../domain/topic/usecase/DeleteTopicFeature';

export interface DeleteTopicCommandData {
  id: string;
}

export class DeleteTopicCommand extends BaseCommand<boolean, DeleteTopicCommandData> {
  constructor(
    private readonly deleteTopicFeature: DeleteTopicFeature
  ) {
    super();
  }

  async execute(data: DeleteTopicCommandData): Promise<boolean> {
    // Convert command data to feature data
    const featureData: DeleteTopicFeatureData = {
      id: data.id
    };

    // Execute the feature
    return await this.deleteTopicFeature.execute(featureData);
  }
} 