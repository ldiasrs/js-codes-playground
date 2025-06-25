import 'reflect-metadata';
import { injectable, inject, unmanaged } from 'inversify';
import { BaseCommand } from '../Command';
import { DeleteCustomerFeature, DeleteCustomerFeatureData } from '../../../domain/customer/usecase/DeleteCustomerFeature';
import { TYPES } from '../../../infrastructure/di/types';

export interface DeleteCustomerCommandData {
  id: string;
}

@injectable()
export class DeleteCustomerCommand extends BaseCommand<boolean> {
  constructor(
    @unmanaged() private readonly data: DeleteCustomerCommandData,
    @inject(TYPES.DeleteCustomerFeature) private readonly deleteCustomerFeature: DeleteCustomerFeature
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