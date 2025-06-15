import { v4 as uuidv4 } from 'uuid';
import { GovIdentification, GovIdentificationType } from '../../shared/GovIdentification';

export class Customer {
  constructor(
    public readonly customerName: string,
    public readonly govIdentification: GovIdentification,
    public readonly id?: string,
    public readonly dateCreated: Date = new Date()
  ) {}

  public getGovIdentificationFormatted(): string {
    return `${this.govIdentification.type}: ${this.govIdentification.content}`;
  }

  public static createWithCPF(customerName: string, cpf: string, id?: string): Customer {
    const govIdentification: GovIdentification = {
      type: GovIdentificationType.CPF,
      content: cpf
    };
    return new Customer(customerName, govIdentification, id);
  }

  public static createWithOtherId(customerName: string, idContent: string, id?: string): Customer {
    const govIdentification: GovIdentification = {
      type: GovIdentificationType.OTHER,
      content: idContent
    };
    return new Customer(customerName, govIdentification, id);
  }
} 