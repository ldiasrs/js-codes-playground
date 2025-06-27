// Customer Domain Exports

// Entities
export type { Customer } from './entities/Customer';
export { CustomerTier } from './entities/Customer';
export type { GovIdentification, GovIdentificationType } from './entities/GovIdentification';
export type { AuthenticationAttempt } from './entities/AuthenticationAttempt';

// Ports
export type { CustomerRepositoryPort, CustomerSearchCriteria } from './ports/CustomerRepositoryPort';
export type { AuthenticationAttemptRepositoryPort } from './ports/AuthenticationAttemptRepositoryPort';
export type { SendVerificationCodePort } from './ports/SendVerificationCodePort';

// Use Cases
export type { CreateCustomerFeature, CreateCustomerFeatureData } from './usecase/CreateCustomerFeature';
export type { UpdateCustomerFeature, UpdateCustomerFeatureData } from './usecase/UpdateCustomerFeature';
export type { DeleteCustomerFeature, DeleteCustomerFeatureData } from './usecase/DeleteCustomerFeature';
export type { AuthCustomerFeature, AuthCustomerFeatureData } from './usecase/AuthCustomerFeature';
export type { VerifyCustomerFeature, VerifyCustomerFeatureData } from './usecase/VerifyCustomerFeature'; 