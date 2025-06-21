import { GovIdentificationType } from '../../domain/shared/GovIdentification';

export interface GovIdentificationDTO {
  type: GovIdentificationType;
  content: string;
} 