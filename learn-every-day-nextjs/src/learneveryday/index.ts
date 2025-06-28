// Application DTOs (Anti-Corruption Layer)
export * from './application/dto/CustomerDTO';
export * from './application/dto/TopicDTO';
export * from './application/dto/GovIdentificationDTO';

// Application Commands
export * from './application/commands/customer/CreateCustomerCommand';
export * from './application/commands/customer/DeleteCustomerCommand';
export * from './application/commands/customer/AuthCustomerCommand';
export * from './application/commands/customer/VerifyCustomerCommand';
export * from './application/commands/topic/AddTopicCommand';
export * from './application/commands/topic/UpdateTopicCommand';
export * from './application/commands/topic/DeleteTopicCommand';
export * from './application/commands/topic-history/ProcessTopicHistoryWorkflowCommand';

// Application Queries
export * from './application/queries/topic/GetTopicByIdQuery';
export * from './application/queries/topic/GetAllTopicsQuery';
export * from './application/queries/topic/SearchTopicsQuery';
