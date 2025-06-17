import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { BaseCommand } from '../Command';
import { DeleteTopicFeature, DeleteTopicFeatureData } from '../../../domain/topic/features/DeleteTopicFeature';
import { TYPES } from '../../../infrastructure/di/types';

export interface DeleteTopicCommandData {
  id: string;
}

@injectable()
export class DeleteTopicCommand extends BaseCommand<boolean> {
  constructor(
    private readonly data: DeleteTopicCommandData,
    @inject(TYPES.DeleteTopicFeature) private readonly deleteTopicFeature: DeleteTopicFeature
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