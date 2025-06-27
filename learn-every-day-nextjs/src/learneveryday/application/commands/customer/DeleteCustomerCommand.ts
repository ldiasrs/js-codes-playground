import { BaseCommand } from '../Command';
import { DeleteCustomerFeature, DeleteCustomerFeatureData } from '../../../domain/customer/usecase/DeleteCustomerFeature';

export interface DeleteCustomerCommandData {
  id: string;
}

export class DeleteCustomerCommand extends BaseCommand<boolean, DeleteCustomerCommandData> {
  constructor(
    private readonly deleteCustomerFeature: DeleteCustomerFeature
  ) {
    super();
  }

  async execute(data: DeleteCustomerCommandData): Promise<boolean> {
    // Convert command data to feature data
    const featureData: DeleteCustomerFeatureData = {
      id: data.id
    };

    // Execute the feature
    return await this.deleteCustomerFeature.execute(featureData);
  }
} 