import { SendTopicHistoryByEmailPort } from '../../features/topic-histoy/application/ports/SendTopicHistoryByEmailPort';
import { SendVerificationCodePort } from '../../features/auth/application/ports/SendVerificationCodePort';
import { NodemailerTopicHistoryEmailSender } from '../adapters/NodemailerTopicHistoryEmailSender';
import { NodemailerVerificationCodeSender } from '../adapters/NodemailerVerificationCodeSender';
import { LoggerFactory } from './LoggerFactory';

export class EmailSenderFactory {
  /**
   * Creates a nodemailer-based email sender for topic history
   * @returns SendTopicHistoryByEmailPort implementation
   */
  static createNodemailerSender(): SendTopicHistoryByEmailPort {
    return new NodemailerTopicHistoryEmailSender(LoggerFactory.createLoggerForClass('NodemailerTopicHistoryEmailSender'));
  }

  /**
   * Creates a nodemailer-based verification code sender
   * @returns SendVerificationCodePort implementation
   */
  static createVerificationCodeSender(): SendVerificationCodePort {
    return new NodemailerVerificationCodeSender(LoggerFactory.createLoggerForClass('NodemailerVerificationCodeSender'));
  }
} 