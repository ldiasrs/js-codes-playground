import { Customer } from '../../domain/entities/Customer';
import { CustomerRepositoryPort, CustomerSearchCriteria } from '../../domain/ports/CustomerRepositoryPort';
import * as fs from 'fs';
import * as path from 'path';
import moment from 'moment';

interface CustomerData {
  id: string;
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  dateCreated: string;
}

export class JsonCustomerRepository implements CustomerRepositoryPort {
  private readonly customersFile: string;
  private readonly topicsFile: string;
  private readonly topicHistoryFile: string;

  constructor(dataDir: string) {
    this.customersFile = path.join(dataDir, 'customers.json');
    this.topicsFile = path.join(dataDir, 'topics.json');
    this.topicHistoryFile = path.join(dataDir, 'topic-history.json');
    this.ensureFilesExist();
  }

  private ensureFilesExist(): void {
    if (!fs.existsSync(this.customersFile)) {
      fs.writeFileSync(this.customersFile, '[]');
    }
    if (!fs.existsSync(this.topicsFile)) {
      fs.writeFileSync(this.topicsFile, '[]');
    }
    if (!fs.existsSync(this.topicHistoryFile)) {
      fs.writeFileSync(this.topicHistoryFile, '[]');
    }
  }

  private readCustomers(): CustomerData[] {
    const data = fs.readFileSync(this.customersFile, 'utf8');
    return JSON.parse(data);
  }

  private writeCustomers(customers: CustomerData[]): void {
    fs.writeFileSync(this.customersFile, JSON.stringify(customers, null, 2));
  }

  private readTopics(): any[] {
    const data = fs.readFileSync(this.topicsFile, 'utf8');
    return JSON.parse(data);
  }

  async save(customer: Customer): Promise<Customer> {
    const customers = this.readCustomers();
    const customerData: CustomerData = {
      id: customer.id || '',
      customerName: customer.customerName,
      govIdentification: customer.govIdentification,
      dateCreated: customer.dateCreated.toISOString()
    };

    const existingIndex = customers.findIndex(c => c.id === customerData.id);
    if (existingIndex >= 0) {
      customers[existingIndex] = customerData;
    } else {
      customers.push(customerData);
    }

    this.writeCustomers(customers);
    return customer;
  }

  async findById(id: string): Promise<Customer | undefined> {
    const customers = this.readCustomers();
    const customerData = customers.find(c => c.id === id);
    
    if (!customerData) {
      return undefined;
    }

    return new Customer(
      customerData.customerName,
      customerData.govIdentification,
      customerData.id,
      new Date(customerData.dateCreated)
    );
  }

  async findAll(): Promise<Customer[]> {
    const customers = this.readCustomers();
    return customers.map(data => new Customer(
      data.customerName,
      data.govIdentification,
      data.id,
      new Date(data.dateCreated)
    ));
  }

  async findByCustomerName(customerName: string): Promise<Customer[]> {
    const customers = this.readCustomers();
    return customers
      .filter(data => data.customerName.toLowerCase().includes(customerName.toLowerCase()))
      .map(data => new Customer(
        data.customerName,
        data.govIdentification,
        data.id,
        new Date(data.dateCreated)
      ));
  }

  async findByGovIdentification(type: string, content: string): Promise<Customer | undefined> {
    const customers = this.readCustomers();
    const customerData = customers.find(c => 
      c.govIdentification.type === type && c.govIdentification.content === content
    );
    
    if (!customerData) {
      return undefined;
    }

    return new Customer(
      customerData.customerName,
      customerData.govIdentification,
      customerData.id,
      new Date(customerData.dateCreated)
    );
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Customer[]> {
    const customers = this.readCustomers();
    return customers
      .filter(data => {
        const dateCreated = new Date(data.dateCreated);
        return dateCreated >= dateFrom && dateCreated <= dateTo;
      })
      .map(data => new Customer(
        data.customerName,
        data.govIdentification,
        data.id,
        new Date(data.dateCreated)
      ));
  }

  async findByTopicCount(minTopics: number, maxTopics?: number): Promise<Customer[]> {
    const customers = this.readCustomers();
    const topics = this.readTopics();
    
    return customers.filter(customerData => {
      const customerTopics = topics.filter(topic => topic.customerId === customerData.id);
      const topicCount = customerTopics.length;
      
      if (maxTopics !== undefined) {
        return topicCount >= minTopics && topicCount <= maxTopics;
      }
      return topicCount >= minTopics;
    }).map(data => new Customer(
      data.customerName,
      data.govIdentification,
      data.id,
      new Date(data.dateCreated)
    ));
  }

  async search(criteria: CustomerSearchCriteria): Promise<Customer[]> {
    let customers = await this.findAll();

    if (criteria.customerName) {
      customers = customers.filter(customer => 
        customer.customerName.toLowerCase().includes(criteria.customerName!.toLowerCase())
      );
    }

    if (criteria.govIdentificationType) {
      customers = customers.filter(customer => 
        customer.govIdentification.type === criteria.govIdentificationType
      );
    }

    if (criteria.govIdentificationContent) {
      customers = customers.filter(customer => 
        customer.govIdentification.content.includes(criteria.govIdentificationContent!)
      );
    }

    if (criteria.dateFrom || criteria.dateTo) {
      customers = customers.filter(customer => {
        const dateCreated = customer.dateCreated;
        if (criteria.dateFrom && dateCreated < criteria.dateFrom) return false;
        if (criteria.dateTo && dateCreated > criteria.dateTo) return false;
        return true;
      });
    }

    if (criteria.hasTopics !== undefined) {
      const topics = this.readTopics();
      if (criteria.hasTopics) {
        customers = customers.filter(customer => {
          const customerTopics = topics.filter(topic => topic.customerId === customer.id);
          return customerTopics.length > 0;
        });
      } else {
        customers = customers.filter(customer => {
          const customerTopics = topics.filter(topic => topic.customerId === customer.id);
          return customerTopics.length === 0;
        });
      }
    }

    if (criteria.topicCount !== undefined) {
      const topics = this.readTopics();
      customers = customers.filter(customer => {
        const customerTopics = topics.filter(topic => topic.customerId === customer.id);
        return customerTopics.length === criteria.topicCount;
      });
    }

    if (criteria.hasRecentActivity) {
      const hours = criteria.recentActivityHours || 24;
      customers = customers.filter(customer => {
        const topics = this.readTopics();
        const customerTopics = topics.filter(topic => topic.customerId === customer.id);
        
        if (customerTopics.length === 0) return false;
        
        const cutoffDate = moment().subtract(hours, 'hours');
        const hasRecentActivity = customerTopics.some(topic => {
          const topicDate = moment(topic.dateCreated);
          return topicDate.isAfter(cutoffDate);
        });
        
        return hasRecentActivity;
      });
    }

    return customers;
  }

  async delete(id: string): Promise<boolean> {
    const customers = this.readCustomers();
    const initialLength = customers.length;
    const filteredCustomers = customers.filter(c => c.id !== id);
    
    if (filteredCustomers.length < initialLength) {
      this.writeCustomers(filteredCustomers);
      return true;
    }
    
    return false;
  }

  async getCustomersCreatedToday(): Promise<Customer[]> {
    const today = moment().startOf('day');
    const tomorrow = moment().endOf('day');
    
    return this.findByDateRange(today.toDate(), tomorrow.toDate());
  }

  async getCustomersCreatedThisWeek(): Promise<Customer[]> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    
    return this.findByDateRange(weekStart.toDate(), weekEnd.toDate());
  }

  async getCustomersCreatedThisMonth(): Promise<Customer[]> {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    
    return this.findByDateRange(monthStart.toDate(), monthEnd.toDate());
  }

  async getCustomersWithRecentActivity(hours: number): Promise<Customer[]> {
    const customers = await this.findAll();
    const topics = this.readTopics();
    
    return customers.filter(customer => {
      const customerTopics = topics.filter(topic => topic.customerId === customer.id);
      
      if (customerTopics.length === 0) return false;
      
      const cutoffDate = moment().subtract(hours, 'hours');
      const hasRecentActivity = customerTopics.some(topic => {
        const topicDate = moment(topic.dateCreated);
        return topicDate.isAfter(cutoffDate);
      });
      
      return hasRecentActivity;
    });
  }
} 