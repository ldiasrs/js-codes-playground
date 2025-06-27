import { v4 as uuidv4 } from 'uuid';
import { GovIdentification, GovIdentificationType } from './GovIdentification';

export enum CustomerTier {
  Basic = 'Basic',
  Standard = 'Standard',
  Premium = 'Premium'
}

export class Customer {
  constructor(
    public readonly customerName: string,
    public readonly govIdentification: GovIdentification,
    public readonly email: string,
    public readonly phoneNumber: string,
    public readonly id?: string,
    public readonly dateCreated: Date = new Date(),
    public readonly tier: CustomerTier = CustomerTier.Basic
  ) {
    // Generate ID if not provided
    if (!id) {
      this.id = uuidv4();
    }
  }

  public getGovIdentificationFormatted(): string {
    return `${this.govIdentification.type}: ${this.govIdentification.content}`;
  }

  public static createWithCPF(customerName: string, cpf: string, email: string, phoneNumber: string, id?: string, tier: CustomerTier = CustomerTier.Basic): Customer {
    const govIdentification: GovIdentification = {
      type: GovIdentificationType.CPF,
      content: cpf
    };
    return new Customer(customerName, govIdentification, email, phoneNumber, id, new Date(), tier);
  }

  public static createWithOtherId(customerName: string, idContent: string, email: string, phoneNumber: string, id?: string, tier: CustomerTier = CustomerTier.Basic): Customer {
    const govIdentification: GovIdentification = {
      type: GovIdentificationType.OTHER,
      content: idContent
    };
    return new Customer(customerName, govIdentification, email, phoneNumber, id, new Date(), tier);
  }
} 