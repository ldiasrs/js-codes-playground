import { v4 as uuidv4 } from 'uuid';

export class TopicHistory {
  public readonly id: string;
  public readonly topicId: string;
  public readonly content: string;
  public readonly createdAt: Date;

  constructor(topicId: string, content: string, id?: string, createdAt?: Date) {
    this.id = id || uuidv4();
    this.topicId = topicId;
    this.content = content;
    this.createdAt = createdAt || new Date();
  }
} 