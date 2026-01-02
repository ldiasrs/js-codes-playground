import { GovIdentificationDTO } from './GovIdentificationDTO';

export interface CustomerDTO {
  id?: string;
  customerName: string;
  govIdentification: GovIdentificationDTO;
  email: string;
  phoneNumber: string;
  dateCreated: string;
  tier: string;
}

