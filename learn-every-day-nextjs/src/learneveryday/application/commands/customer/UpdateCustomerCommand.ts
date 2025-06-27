import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { UpdateCustomerFeature, UpdateCustomerFeatureData } from '../../../domain/customer/usecase/UpdateCustomerFeature';

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

export class UpdateCustomerCommand extends BaseCommand<CustomerDTO, UpdateCustomerCommandData> {
  constructor(
    private readonly updateCustomerFeature: UpdateCustomerFeature
  ) {
    super();
  }

  async execute(data: UpdateCustomerCommandData): Promise<CustomerDTO> {
    // Convert command data to feature data
    const featureData: UpdateCustomerFeatureData = {
      id: data.id,
      customerName: data.customerName,
      govIdentification: data.govIdentification,
      email: data.email,
      phoneNumber: data.phoneNumber
    };

    // Execute the feature
    const result = await this.updateCustomerFeature.execute(featureData);

    // Convert result to DTO
    return CustomerDTOMapper.toDTO(result.customer);
  }
} 