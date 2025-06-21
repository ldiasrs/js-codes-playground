import 'reflect-metadata';
import { injectable, inject, unmanaged } from 'inversify';
import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { UpdateCustomerFeature, UpdateCustomerFeatureData } from '../../../domain/customer/usecase/UpdateCustomerFeature';
import { TYPES } from '../../../infrastructure/di/types';

export interface UpdateCustomerCommandData {
  id: string;
  customerName?: string;
  govIdentification?: {
    type: string;
    content: string;
  };
  email?: string;
  phoneNumber?: string;
}

@injectable()
export class UpdateCustomerCommand extends BaseCommand<CustomerDTO> {
  constructor(
    @unmanaged() private readonly data: UpdateCustomerCommandData,
    @inject(TYPES.UpdateCustomerFeature) private readonly updateCustomerFeature: UpdateCustomerFeature
  ) {
    super();
  }

  async execute(): Promise<CustomerDTO> {
    // Convert command data to feature data
    const featureData: UpdateCustomerFeatureData = {
      id: this.data.id,
      customerName: this.data.customerName,
      govIdentification: this.data.govIdentification,
      email: this.data.email,
      phoneNumber: this.data.phoneNumber
    };

    // Execute the feature
    const result = await this.updateCustomerFeature.execute(featureData);

    // Convert result to DTO
    return CustomerDTOMapper.toDTO(result.customer);
  }
} 