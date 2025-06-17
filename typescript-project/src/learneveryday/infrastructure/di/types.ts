export const TYPES = {
  // Repositories
  CustomerRepository: Symbol.for('CustomerRepository'),
  TopicRepository: Symbol.for('TopicRepository'),
  TopicHistoryRepository: Symbol.for('TopicHistoryRepository'),
  ScheduledTaskRepository: Symbol.for('ScheduledTaskRepository'),

  // Ports
  GenerateTopicHistoryPort: Symbol.for('GenerateTopicHistoryPort'),
  SendTopicHistoryByEmailPort: Symbol.for('SendTopicHistoryByEmailPort'),

  // Services
  SchedulingService: Symbol.for('SchedulingService'),

  // Commands
  CreateCustomerCommand: Symbol.for('CreateCustomerCommand'),
  UpdateCustomerCommand: Symbol.for('UpdateCustomerCommand'),
  DeleteCustomerCommand: Symbol.for('DeleteCustomerCommand'),
  AddTopicCommand: Symbol.for('AddTopicCommand'),
  DeleteTopicCommand: Symbol.for('DeleteTopicCommand'),
  AddTopicHistoryCommand: Symbol.for('AddTopicHistoryCommand'),
  GenerateTopicHistoryCommand: Symbol.for('GenerateTopicHistoryCommand'),
  GenerateAndEmailTopicHistoryCommand: Symbol.for('GenerateAndEmailTopicHistoryCommand'),

  // Features
  CreateCustomerFeature: Symbol.for('CreateCustomerFeature'),
  UpdateCustomerFeature: Symbol.for('UpdateCustomerFeature'),
  DeleteCustomerFeature: Symbol.for('DeleteCustomerFeature'),
  AddTopicFeature: Symbol.for('AddTopicFeature'),
  AddTopicSimpleFeature: Symbol.for('AddTopicSimpleFeature'),
  DeleteTopicFeature: Symbol.for('DeleteTopicFeature'),
  AddTopicHistoryFeature: Symbol.for('AddTopicHistoryFeature'),
  GenerateTopicHistoryFeature: Symbol.for('GenerateTopicHistoryFeature'),
  GenerateAndEmailTopicHistoryFeature: Symbol.for('GenerateAndEmailTopicHistoryFeature'),
  SendTopicHistoryFeature: Symbol.for('SendTopicHistoryFeature'),
} as const; 