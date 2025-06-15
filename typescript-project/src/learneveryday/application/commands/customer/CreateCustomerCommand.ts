import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { CreateCustomerFeature, CreateCustomerFeatureData } from '../../../domain/customer/features/CreateCustomerFeature';

export interface CreateCustomerCommandData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
}

export class CreateCustomerCommand extends BaseCommand<CustomerDTO> {
  constructor(
    private readonly data: CreateCustomerCommandData,
    private readonly createCustomerFeature: CreateCustomerFeature
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