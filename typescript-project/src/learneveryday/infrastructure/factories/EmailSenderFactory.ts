import { SendTopicHistoryByEmailPort } from '../../domain/topic-history/ports/SendTopicHistoryByEmailPort';
import { NodemailerTopicHistoryEmailSender } from '../adapters/NodemailerTopicHistoryEmailSender';

export class EmailSenderFactory {
  /**
   * Creates a nodemailer-based email sender
   * @returns SendTopicHistoryByEmailPort implementation
   */
  static createNodemailerSender(): SendTopicHistoryByEmailPort {
    return new NodemailerTopicHistoryEmailSender();
  }
} 