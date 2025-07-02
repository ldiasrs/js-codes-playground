import { CustomerTier } from '../../../domain/customer/entities/Customer';
import { CreateCustomerFeature, CreateCustomerFeatureData } from '../../../domain/customer/usecase/CreateCustomerFeature';
import { BaseCommand } from '../Command';

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

export interface CreateCustomerCommandResponse {
  customerId: string;
}


export class CreateCustomerCommand extends BaseCommand<CreateCustomerCommandResponse, CreateCustomerCommandData> {
  constructor(private readonly createCustomerFeature: CreateCustomerFeature) {
    super();
  }

  async execute(data?: CreateCustomerCommandData): Promise<CreateCustomerCommandResponse> {
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
    return {
      customerId: customer.id || ''
    };
  }
} 