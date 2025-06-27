import { Customer } from '../../domain/customer/entities/Customer';
import { GovIdentificationDTO } from './GovIdentificationDTO';

export interface CustomerDTO {
  id: string;
  customerName: string;
  govIdentification: GovIdentificationDTO;
  email: string;
  phoneNumber: string;
  dateCreated: Date;
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
      dateCreated: customer.dateCreated
    };
  }
} 