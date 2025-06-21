import { Customer } from '../entities/Customer';

export interface CustomerSearchCriteria {
  customerName?: string;
  govIdentification?: {
    type: string;
    content: string;
  };
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
  findByGovIdentification(govIdentification: { type: string; content: string }): Promise<Customer | undefined>;
  findByDateRange(dateFrom: Date, dateTo: Date): Promise<Customer[]>;
  search(criteria: CustomerSearchCriteria): Promise<Customer[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  getCustomersCreatedToday(): Promise<Customer[]>;
  getCustomersCreatedThisWeek(): Promise<Customer[]>;
  getCustomersCreatedThisMonth(): Promise<Customer[]>;
  getCustomersWithRecentActivity(hours: number): Promise<Customer[]>;
} 