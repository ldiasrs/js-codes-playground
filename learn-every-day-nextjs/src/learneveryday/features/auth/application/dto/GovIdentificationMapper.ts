import { GovIdentification } from '../../domain/GovIdentification';
import { GovIdentificationDTO } from './GovIdentificationDTO';

export class GovIdentificationMapper {
  static toDTO(govIdentification: GovIdentification): GovIdentificationDTO {
    return {
      type: govIdentification.type,
      content: govIdentification.content
    };
  }
}

