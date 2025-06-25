import { GovIdentificationType } from '../../domain/customer/entities/GovIdentification';

export interface GovIdentificationDTO {
  type: GovIdentificationType;
  content: string;
} 