export interface SendTopicClosedEmailPortData {
  customerId: string;
  email: string;
  topicSubject: string;
}

export interface SendTopicClosedEmailPort {
  send(data: SendTopicClosedEmailPortData): Promise<void>;
}