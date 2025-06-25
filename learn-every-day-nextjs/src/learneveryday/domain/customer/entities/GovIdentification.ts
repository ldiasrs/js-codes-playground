export enum GovIdentificationType {
  CPF = 'CPF',
  OTHER = 'OTHER'
}

export interface GovIdentification {
  type: GovIdentificationType;
  content: string;
} 