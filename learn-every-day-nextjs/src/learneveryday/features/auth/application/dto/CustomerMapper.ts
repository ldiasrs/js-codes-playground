import { Customer } from '../../domain/Customer';
import { CustomerDTO } from './CustomerDTO';
import { GovIdentificationMapper } from './GovIdentificationMapper';

export class CustomerMapper {
  static toDTO(customer: Customer): CustomerDTO {
    return {
      id: customer.id,
      customerName: customer.customerName,
      govIdentification: GovIdentificationMapper.toDTO(customer.govIdentification),
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      dateCreated: customer.dateCreated.toISOString(),
      tier: customer.tier
    };
  }
}

