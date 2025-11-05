import { v4 as uuidv4 } from 'uuid';

export class Topic {
  public readonly id: string;
  public readonly customerId: string;
  public readonly subject: string;
  public readonly dateCreated: Date;
  public readonly closed: boolean;

  private static readonly MAX_SUBJECT_LENGTH = 10000;

  constructor(customerId: string, subject: string, id?: string, dateCreated?: Date, closed?: boolean) {
    this.validateSubject(subject);
    this.id = id || uuidv4();
    this.customerId = customerId;
    this.subject = subject;
    this.dateCreated = dateCreated || new Date();
    this.closed = closed || false;
  }

  private validateSubject(subject: string): void {
    if (!subject || subject.trim().length === 0) {
      throw new Error('Topic subject cannot be empty');
    }
    if (subject.length > Topic.MAX_SUBJECT_LENGTH) {
      throw new Error(`Topic subject cannot exceed ${Topic.MAX_SUBJECT_LENGTH} characters. Current length: ${subject.length}`);
    }
  }
} 