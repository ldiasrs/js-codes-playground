import { Customer } from '../../../domain/customer/entities/Customer';
import { CustomerRepositoryPort, CustomerSearchCriteria } from '../../../domain/customer/ports/CustomerRepositoryPort';
import { GovIdentificationType } from '../../../domain/customer/entities/GovIdentification';
import { DatabaseManager } from '../../database/DatabaseManager';
import moment from 'moment';

interface CustomerData {
  id: string;
  customer_name: string;
  gov_identification_type: string;
  gov_identification_content: string;
  email: string;
  phone_number: string;
  date_created: string;
}

export class SQLCustomerRepository implements CustomerRepositoryPort {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async save(customer: Customer): Promise<Customer> {
    const connection = await this.dbManager.getConnection('customers');
    
    const customerData: CustomerData = {
      id: customer.id || '',
      customer_name: customer.customerName,
      gov_identification_type: customer.govIdentification.type,
      gov_identification_content: customer.govIdentification.content,
      email: customer.email,
      phone_number: customer.phoneNumber,
      date_created: customer.dateCreated.toISOString()
    };

    await connection.query(
      `INSERT OR REPLACE INTO customers 
       (id, customer_name, gov_identification_type, gov_identification_content, email, phone_number, date_created)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customerData.id,
        customerData.customer_name,
        customerData.gov_identification_type,
        customerData.gov_identification_content,
        customerData.email,
        customerData.phone_number,
        customerData.date_created
      ]
    );

    return customer;
  }

  async findById(id: string): Promise<Customer | undefined> {
    const connection = await this.dbManager.getConnection('customers');
    
    const rows = await connection.query(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    ) as CustomerData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToCustomer(rows[0]);
  }

  async findAll(): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    const rows = await connection.query('SELECT * FROM customers') as CustomerData[];
    return rows.map(row => this.mapToCustomer(row));
  }

  async findByCustomerName(customerName: string): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    const rows = await connection.query(
      'SELECT * FROM customers WHERE customer_name LIKE ?',
      [`%${customerName}%`]
    ) as CustomerData[];

    return rows.map(row => this.mapToCustomer(row));
  }

  async findByGovIdentification(govIdentification: { type: string; content: string }): Promise<Customer | undefined> {
    const connection = await this.dbManager.getConnection('customers');
    
    const rows = await connection.query(
      'SELECT * FROM customers WHERE gov_identification_type = ? AND gov_identification_content = ?',
      [govIdentification.type, govIdentification.content]
    ) as CustomerData[];

    if (rows.length === 0) {
      return undefined;
    }

    return this.mapToCustomer(rows[0]);
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    const rows = await connection.query(
      'SELECT * FROM customers WHERE date_created BETWEEN ? AND ?',
      [dateFrom.toISOString(), dateTo.toISOString()]
    ) as CustomerData[];

    return rows.map(row => this.mapToCustomer(row));
  }

  async search(criteria: CustomerSearchCriteria): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.customerName) {
      sql += ' AND customer_name LIKE ?';
      params.push(`%${criteria.customerName}%`);
    }

    if (criteria.govIdentification) {
      if (criteria.govIdentification.type) {
        sql += ' AND gov_identification_type = ?';
        params.push(criteria.govIdentification.type);
      }
      if (criteria.govIdentification.content) {
        sql += ' AND gov_identification_content LIKE ?';
        params.push(`%${criteria.govIdentification.content}%`);
      }
    }

    if (criteria.dateFrom || criteria.dateTo) {
      if (criteria.dateFrom) {
        sql += ' AND date_created >= ?';
        params.push(criteria.dateFrom.toISOString());
      }
      if (criteria.dateTo) {
        sql += ' AND date_created <= ?';
        params.push(criteria.dateTo.toISOString());
      }
    }

    const rows = await connection.query(sql, params) as CustomerData[];
    return rows.map(row => this.mapToCustomer(row));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('customers');
    
    await connection.query(
      'DELETE FROM customers WHERE id = ?',
      [id]
    );

    return true; // SQLite doesn't return affected rows count in a standard way
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('customers');
    
    const rows = await connection.query('SELECT COUNT(*) as count FROM customers') as { count: number }[];
    return rows[0]?.count || 0;
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
    const connection = await this.dbManager.getConnection('customers');
    
    const cutoffDate = moment().subtract(hours, 'hours').toISOString();
    
    // Find customers who have topics created after the cutoff date
    const rows = await connection.query(
      `SELECT DISTINCT c.* FROM customers c
       INNER JOIN topics t ON c.id = t.customer_id
       WHERE t.date_created >= ?`,
      [cutoffDate]
    ) as CustomerData[];

    return rows.map(row => this.mapToCustomer(row));
  }

  private mapToCustomer(data: CustomerData): Customer {
    return new Customer(
      data.customer_name,
      {
        type: data.gov_identification_type as GovIdentificationType,
        content: data.gov_identification_content
      },
      data.email,
      data.phone_number,
      data.id,
      new Date(data.date_created)
    );
  }
} 