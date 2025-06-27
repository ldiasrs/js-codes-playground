import { BaseCommand } from '../Command';
import { CustomerDTO, CustomerDTOMapper } from '../../dto/CustomerDTO';
import { CreateCustomerFeature, CreateCustomerFeatureData } from '../../../domain/customer/usecase/CreateCustomerFeature';
import { CustomerTier } from '../../../domain/customer/entities/Customer';

export interface CreateCustomerCommandData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
  tier?: CustomerTier;
}

export class CreateCustomerCommand extends BaseCommand<CustomerDTO, CreateCustomerCommandData> {
  constructor(private readonly createCustomerFeature: CreateCustomerFeature) {
    super();
  }

  async execute(data?: CreateCustomerCommandData): Promise<CustomerDTO> {
    if (!data) {
      throw new Error('CreateCustomerCommand requires data parameter');
    }

    const featureData: CreateCustomerFeatureData = {
      customerName: data.customerName,
      govIdentification: data.govIdentification,
      email: data.email,
      phoneNumber: data.phoneNumber,
      tier: data.tier
    };

    const customer = await this.createCustomerFeature.execute(featureData);
    return CustomerDTOMapper.toDTO(customer);
  }
} 