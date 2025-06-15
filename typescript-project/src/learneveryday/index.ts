
// Application DTOs (Anti-Corruption Layer)
export * from './application/dto/CustomerDTO';
export * from './application/dto/TopicDTO';
export * from './application/dto/GovIdentificationDTO';

// Application Commands
export * from './application/commands/customer/CreateCustomerCommand';
export * from './application/commands/customer/UpdateCustomerCommand';
export * from './application/commands/customer/DeleteCustomerCommand';
export * from './application/commands/topic/AddTopicCommand';
export * from './application/commands/topic/DeleteTopicCommand';
export * from './application/commands/topic-history/AddTopicHistoryCommand';

// Application Queries
export * from './application/queries/customer/GetCustomerByIdQuery';
export * from './application/queries/customer/SearchCustomerQuery';
export * from './application/queries/customer/GetAllCustomersQuery';
export * from './application/queries/statistics/GetCustomerStatisticsQuery';
export * from './application/queries/topic/GetTopicByIdQuery';
export * from './application/queries/topic/SearchTopicsQuery';
export * from './application/queries/topic-history/GetTopicHistoryQuery';
export * from './application/queries/statistics/GetStatisticsQuery';
