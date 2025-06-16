import { Customer } from '../../customer/entities/Customer';
import { TopicHistory } from '../entities/TopicHistory';
import { SendTopicHistoryByEmailPort } from '../ports/SendTopicHistoryByEmailPort';

export type SendChannel = 'email' | 'whatsapp';

export interface SendTopicHistoryFeatureData {
  customer: Customer;
  topicHistory: TopicHistory;
  channel: SendChannel;
}

export class SendTopicHistoryFeature {
  constructor(
    private readonly sendTopicHistoryByEmailPort: SendTopicHistoryByEmailPort
  ) {}

  /**
   * Executes the SendTopicHistory feature
   * @param data The data containing customer, topicHistory, and channel
   * @returns Promise<void> Resolves when topic history is sent successfully
   * @throws Error if channel is not supported or sending fails
   */
  async execute(data: SendTopicHistoryFeatureData): Promise<void> {
    const { customer, topicHistory, channel } = data;

    // Step 1: Validate channel support
    if (channel === 'whatsapp') {
      throw new Error('WhatsApp channel is not supported yet');
    }

    if (channel !== 'email') {
      throw new Error(`Unsupported channel: ${channel}. Only 'email' is currently supported.`);
    }

    // Step 2: Send the topic history by email
    await this.sendTopicHistoryByEmailPort.send({
      email: customer.email,
      topicHistory: topicHistory,
      topicSubject: undefined // We don't have topic subject in this context
    });
  }
} 