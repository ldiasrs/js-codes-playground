import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { UpdateCustomerFeature, UpdateCustomerFeatureData } from '../../../domain/feature/UpdateCustomerFeature';

export interface UpdateCustomerCommandData {
  id: string;
  customerName?: string;
  govIdentification?: {
    type: string;
    content: string;
  };
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
      govIdentification: this.data.govIdentification
    };

    // Execute the feature
    const result = await this.updateCustomerFeature.execute(featureData);

    // Convert result to DTO
    return CustomerDTOMapper.toDTO(result.customer, result.topics);
  }
} 