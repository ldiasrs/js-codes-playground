import { SendTopicHistoryByEmailPort } from '../../domain/topic-history/ports/SendTopicHistoryByEmailPort';
import { SendVerificationCodePort } from '../../domain/customer/ports/SendVerificationCodePort';
import { NodemailerTopicHistoryEmailSender } from '../adapters/NodemailerTopicHistoryEmailSender';
import { NodemailerVerificationCodeSender } from '../adapters/NodemailerVerificationCodeSender';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';

export class EmailSenderFactory {
  /**
   * Creates a nodemailer-based email sender for topic history
   * @param logger The logger instance to use
   * @returns SendTopicHistoryByEmailPort implementation
   */
  static createNodemailerSender(logger: LoggerPort): SendTopicHistoryByEmailPort {
    return new NodemailerTopicHistoryEmailSender(logger);
  }

  /**
   * Creates a nodemailer-based verification code sender
   * @param logger The logger instance to use
   * @returns SendVerificationCodePort implementation
   */
  static createVerificationCodeSender(logger: LoggerPort): SendVerificationCodePort {
    return new NodemailerVerificationCodeSender(logger);
  }
} 