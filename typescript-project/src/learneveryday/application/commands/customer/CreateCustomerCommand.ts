import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { CreateCustomerFeature, CreateCustomerFeatureData } from '../../../domain/customer/features/CreateCustomerFeature';
import { TYPES } from '../../../infrastructure/di/types';

export interface CreateCustomerCommandData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
}

@injectable()
export class CreateCustomerCommand extends BaseCommand<CustomerDTO> {
  constructor(
    private readonly data: CreateCustomerCommandData,
    @inject(TYPES.CreateCustomerFeature) private readonly createCustomerFeature: CreateCustomerFeature
  ) {
    super();
  }

  async execute(): Promise<CustomerDTO> {
    // Convert command data to feature data
    const featureData: CreateCustomerFeatureData = {
      customerName: this.data.customerName,
      govIdentification: this.data.govIdentification,
      email: this.data.email,
      phoneNumber: this.data.phoneNumber
    };

    // Execute the feature
    const result = await this.createCustomerFeature.execute(featureData);

    // Convert result to DTO
    return CustomerDTOMapper.toDTO(result.customer, result.topics);
  }
} 