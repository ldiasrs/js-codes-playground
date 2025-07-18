import { Customer } from '../entities/Customer';

export interface CustomerSearchCriteria {
  customerName?: string;
  govIdentification?: {
    type: string;
    content: string;
  };
  tier?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasRecentActivity?: boolean;
  recentActivityHours?: number;
}

export interface CustomerRepositoryPort {
  save(customer: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer | undefined>;
  findAll(): Promise<Customer[]>;
  findByCustomerName(customerName: string): Promise<Customer[]>;
  findByEmail(email: string): Promise<Customer | undefined>;
  findByGovIdentification(govIdentification: { type: string; content: string }): Promise<Customer | undefined>;
  findByTier(tier: string): Promise<Customer[]>;
  findByDateRange(dateFrom: Date, dateTo: Date): Promise<Customer[]>;
  search(criteria: CustomerSearchCriteria): Promise<Customer[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  getCustomersCreatedToday(): Promise<Customer[]>;
  getCustomersCreatedThisWeek(): Promise<Customer[]>;
  getCustomersCreatedThisMonth(): Promise<Customer[]>;
  getCustomersWithRecentActivity(hours: number): Promise<Customer[]>;
} 