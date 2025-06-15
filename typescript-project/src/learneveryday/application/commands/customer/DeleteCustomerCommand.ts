import { BaseCommand } from '../Command';
import { DeleteCustomerFeature, DeleteCustomerFeatureData } from '../../../domain/feature/DeleteCustomerFeature';

export interface DeleteCustomerCommandData {
  id: string;
}

export class DeleteCustomerCommand extends BaseCommand<boolean> {
  constructor(
    private readonly data: DeleteCustomerCommandData,
    private readonly deleteCustomerFeature: DeleteCustomerFeature
  ) {
    super();
  }

  async execute(): Promise<boolean> {
    // Convert command data to feature data
    const featureData: DeleteCustomerFeatureData = {
      id: this.data.id
    };

    // Execute the feature
    return await this.deleteCustomerFeature.execute(featureData);
  }
} 