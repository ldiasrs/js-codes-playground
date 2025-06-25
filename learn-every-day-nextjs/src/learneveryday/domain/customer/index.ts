// Customer Domain Exports

// Entities
export { Customer } from './entities/Customer';

// Ports
export type { CustomerRepositoryPort, CustomerSearchCriteria } from './ports/CustomerRepositoryPort';

// Use Cases
export type { CreateCustomerFeature } from './usecase/CreateCustomerFeature';
export type { UpdateCustomerFeature } from './usecase/UpdateCustomerFeature';
export type { DeleteCustomerFeature } from './usecase/DeleteCustomerFeature'; 