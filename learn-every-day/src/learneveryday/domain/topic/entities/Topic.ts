import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export class Topic {
  public readonly id: string;
  public readonly customerId: string;
  public readonly subject: string;
  public readonly dateCreated: Date;

  constructor(customerId: string, subject: string, id?: string, dateCreated?: Date) {
    this.id = id || uuidv4();
    this.customerId = customerId;
    this.subject = subject;
    this.dateCreated = dateCreated || new Date();
  }
} 