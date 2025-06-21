import { SendTopicHistoryByEmailPort } from '../../domain/topic-history/ports/SendTopicHistoryByEmailPort';
import { NodemailerTopicHistoryEmailSender } from '../adapters/NodemailerTopicHistoryEmailSender';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';

export class EmailSenderFactory {
  /**
   * Creates a nodemailer-based email sender
   * @param logger The logger instance to use
   * @returns SendTopicHistoryByEmailPort implementation
   */
  static createNodemailerSender(logger: LoggerPort): SendTopicHistoryByEmailPort {
    return new NodemailerTopicHistoryEmailSender(logger);
  }
} 