import { v4 as uuidv4 } from 'uuid';

export class Topic {
  public readonly id: string;
  public readonly customerId: string;
  public readonly subject: string;
  public readonly dateCreated: Date;
  public readonly closed: boolean;

  constructor(customerId: string, subject: string, id?: string, dateCreated?: Date, closed?: boolean) {
    this.id = id || uuidv4();
    this.customerId = customerId;
    this.subject = subject;
    this.dateCreated = dateCreated || new Date();
    this.closed = closed || false;
  }
} 