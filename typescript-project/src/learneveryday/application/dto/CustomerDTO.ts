import { Customer } from '../../domain/customer/entities/Customer';
import { Topic } from '../../domain/topic/entities/Topic';
import { GovIdentificationDTO } from './GovIdentificationDTO';
import { TopicDTO, TopicDTOMapper } from './TopicDTO';

export interface CustomerDTO {
  id: string;
  customerName: string;
  govIdentification: GovIdentificationDTO;
  email: string;
  phoneNumber: string;
  topics: TopicDTO[];
  dateCreated: Date;
}

export class CustomerDTOMapper {
  static toDTO(customer: Customer, topics: Topic[]): CustomerDTO {
    return {
      id: customer.id || '',
      customerName: customer.customerName,
      govIdentification: {
        type: customer.govIdentification.type,
        content: customer.govIdentification.content
      },
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      topics: topics.map(topic => TopicDTOMapper.toDTO(topic)),
      dateCreated: customer.dateCreated
    };
  }
} 