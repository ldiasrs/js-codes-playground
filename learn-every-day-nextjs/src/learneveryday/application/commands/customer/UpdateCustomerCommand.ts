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

export class UpdateCustomerCommand extends BaseCommand<CustomerDTO> {
  constructor(
    private readonly data: UpdateCustomerCommandData,
    private readonly updateCustomerFeature: UpdateCustomerFeature
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