import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { CreateCustomerFeature, CreateCustomerFeatureData } from '../../../domain/customer/usecase/CreateCustomerFeature';

export interface CreateCustomerCommandData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
}

export class CreateCustomerCommand extends BaseCommand<CustomerDTO, CreateCustomerCommandData> {
  constructor(
    private readonly createCustomerFeature: CreateCustomerFeature
  ) {
    super();
  }

  async execute(data: CreateCustomerCommandData): Promise<CustomerDTO> {
    // Convert command data to feature data
    const featureData: CreateCustomerFeatureData = {
      customerName: data.customerName,
      govIdentification: data.govIdentification,
      email: data.email,
      phoneNumber: data.phoneNumber
    };

    // Execute the feature
    const result = await this.createCustomerFeature.execute(featureData);

    // Convert result to DTO
    return CustomerDTOMapper.toDTO(result);
  }
} 