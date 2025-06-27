import { Customer, CustomerTier } from '../../domain/customer/entities/Customer';
import { GovIdentificationType } from '../../domain/customer/entities/GovIdentification';

export interface CustomerDTO {
  id: string;
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
  tier: string;
  dateCreated: string;
}

export class CustomerDTOMapper {
  static toDTO(customer: Customer): CustomerDTO {
    return {
      id: customer.id || '',
      customerName: customer.customerName,
      govIdentification: {
        type: customer.govIdentification.type,
        content: customer.govIdentification.content
      },
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      tier: customer.tier,
      dateCreated: customer.dateCreated.toISOString()
    };
  }

  static fromDTO(dto: CustomerDTO): Customer {
    return new Customer(
      dto.customerName,
      {
        type: dto.govIdentification.type as GovIdentificationType,
        content: dto.govIdentification.content
      },
      dto.email,
      dto.phoneNumber,
      dto.id,
      new Date(dto.dateCreated),
      dto.tier as CustomerTier
    );
  }
} 