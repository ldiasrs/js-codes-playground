import { BaseCommand } from '../Command';
import { DeleteTopicFeature, DeleteTopicFeatureData } from '../../../domain/topic/usecase/DeleteTopicFeature';

export interface DeleteTopicCommandData {
  id: string;
}

export class DeleteTopicCommand extends BaseCommand<boolean> {
  constructor(
    private readonly data: DeleteTopicCommandData,
    private readonly deleteTopicFeature: DeleteTopicFeature
  ) {
    super();
  }

  async execute(): Promise<boolean> {
    // Convert command data to feature data
    const featureData: DeleteTopicFeatureData = {
      id: this.data.id
    };

    // Execute the feature
    return await this.deleteTopicFeature.execute(featureData);
  }
} 