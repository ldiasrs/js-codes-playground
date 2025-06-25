export const TYPES = {
  // Repositories
  CustomerRepository: Symbol.for('CustomerRepository'),
  TopicRepository: Symbol.for('TopicRepository'),
  TopicHistoryRepository: Symbol.for('TopicHistoryRepository'),
  TaskProcessRepository: Symbol.for('TaskProcessRepository'),

  // Ports
  GenerateTopicHistoryPort: Symbol.for('GenerateTopicHistoryPort'),
  SendTopicHistoryByEmailPort: Symbol.for('SendTopicHistoryByEmailPort'),

  // Shared Services
  Logger: Symbol.for('Logger'),

  // Commands
  CreateCustomerCommand: Symbol.for('CreateCustomerCommand'),
  UpdateCustomerCommand: Symbol.for('UpdateCustomerCommand'),
  DeleteCustomerCommand: Symbol.for('DeleteCustomerCommand'),
  AddTopicCommand: Symbol.for('AddTopicCommand'),
  DeleteTopicCommand: Symbol.for('DeleteTopicCommand'),
  GenerateTopicHistoryCommand: Symbol.for('GenerateTopicHistoryCommand'),
  GenerateAndEmailTopicHistoryCommand: Symbol.for('GenerateAndEmailTopicHistoryCommand'),

  // Use Cases
  CreateCustomerFeature: Symbol.for('CreateCustomerFeature'),
  UpdateCustomerFeature: Symbol.for('UpdateCustomerFeature'),
  DeleteCustomerFeature: Symbol.for('DeleteCustomerFeature'),
  AddTopicFeature: Symbol.for('AddTopicFeature'),
  DeleteTopicFeature: Symbol.for('DeleteTopicFeature'),
  GenerateAndEmailTopicHistoryFeature: Symbol.for('GenerateAndEmailTopicHistoryFeature'),
  TasksProcessExecutor: Symbol.for('TasksProcessExecutor'),

  // Runners
  GenerateTopicHistoryTaskRunner: Symbol.for('GenerateTopicHistoryTaskRunner'),
  SendTopicHistoryTaskRunner: Symbol.for('SendTopicHistoryTaskRunner'),
  ScheduleGenerateTopicHistoryTaskRunner: Symbol.for('ScheduleGenerateTopicHistoryTaskRunner'),

  // Schedulers
  TriggerTaskProcessExecutorCron: Symbol.for('TriggerTaskProcessExecutorCron'),
} as const; 