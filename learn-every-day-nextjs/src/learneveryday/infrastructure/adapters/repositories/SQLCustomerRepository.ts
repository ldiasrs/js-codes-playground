import { Customer, CustomerTier } from '../../../domain/customer/entities/Customer';
import { CustomerRepositoryPort, CustomerSearchCriteria } from '../../../features/auth/application/ports/CustomerRepositoryPort';
import { GovIdentificationType } from '../../../features/auth/domain/GovIdentification';
import { DatabaseManager } from '../../database/DatabaseManager';
import moment from 'moment';

interface CustomerData {
  id: string;
  customer_name: string;
  gov_identification_type: string;
  gov_identification_content: string;
  email: string;
  phone_number: string;
  tier: string;
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
      tier: customer.tier,
      date_created: customer.dateCreated.toISOString()
    };

    await connection.query(
      `INSERT INTO customers 
       (id, customer_name, gov_identification_type, gov_identification_content, email, phone_number, tier, date_created)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT(id) DO UPDATE SET
         customer_name = EXCLUDED.customer_name,
         gov_identification_type = EXCLUDED.gov_identification_type,
         gov_identification_content = EXCLUDED.gov_identification_content,
         email = EXCLUDED.email,
         phone_number = EXCLUDED.phone_number,
         tier = EXCLUDED.tier,
         date_created = EXCLUDED.date_created`,
      [
        customerData.id,
        customerData.customer_name,
        customerData.gov_identification_type,
        customerData.gov_identification_content,
        customerData.email,
        customerData.phone_number,
        customerData.tier,
        customerData.date_created
      ]
    );

    return customer;
  }

  async findById(id: string): Promise<Customer | undefined> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapToCustomer(result.rows[0] as unknown as CustomerData);
  }

  async findAll(): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query('SELECT * FROM customers');
    return result.rows.map(row => this.mapToCustomer(row as unknown as CustomerData));
  }

  async findByCustomerName(customerName: string): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query(
      'SELECT * FROM customers WHERE customer_name LIKE $1',
      [`%${customerName}%`]
    );

    return result.rows.map(row => this.mapToCustomer(row as unknown as CustomerData));
  }

  async findByEmail(email: string): Promise<Customer | undefined> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapToCustomer(result.rows[0] as unknown as CustomerData);
  }

  async findByGovIdentification(govIdentification: { type: string; content: string }): Promise<Customer | undefined> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query(
      'SELECT * FROM customers WHERE gov_identification_type = $1 AND gov_identification_content = $2',
      [govIdentification.type, govIdentification.content]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return this.mapToCustomer(result.rows[0] as unknown as CustomerData);
  }

  async findByTier(tier: string): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query(
      'SELECT * FROM customers WHERE tier = $1',
      [tier]
    );

    return result.rows.map(row => this.mapToCustomer(row as unknown as CustomerData));
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query(
      'SELECT * FROM customers WHERE date_created BETWEEN $1 AND $2',
      [dateFrom.toISOString(), dateTo.toISOString()]
    );

    return result.rows.map(row => this.mapToCustomer(row as unknown as CustomerData));
  }

  async search(criteria: CustomerSearchCriteria): Promise<Customer[]> {
    const connection = await this.dbManager.getConnection('customers');
    
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params: unknown[] = [];

    if (criteria.customerName) {
      sql += ' AND customer_name LIKE $' + (params.length + 1);
      params.push(`%${criteria.customerName}%`);
    }

    if (criteria.govIdentification) {
      if (criteria.govIdentification.type) {
        sql += ' AND gov_identification_type = $' + (params.length + 1);
        params.push(criteria.govIdentification.type);
      }
      if (criteria.govIdentification.content) {
        sql += ' AND gov_identification_content LIKE $' + (params.length + 1);
        params.push(`%${criteria.govIdentification.content}%`);
      }
    }

    if (criteria.tier) {
      sql += ' AND tier = $' + (params.length + 1);
      params.push(criteria.tier);
    }

    if (criteria.dateFrom || criteria.dateTo) {
      if (criteria.dateFrom) {
        sql += ' AND date_created >= $' + (params.length + 1);
        params.push(criteria.dateFrom.toISOString());
      }
      if (criteria.dateTo) {
        sql += ' AND date_created <= $' + (params.length + 1);
        params.push(criteria.dateTo.toISOString());
      }
    }

    const result = await connection.query(sql, params);
    return result.rows.map(row => this.mapToCustomer(row as unknown as CustomerData));
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query(
      'DELETE FROM customers WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  async count(): Promise<number> {
    const connection = await this.dbManager.getConnection('customers');
    
    const result = await connection.query('SELECT COUNT(*) as count FROM customers');
    return (result.rows[0] as unknown as { count: number })?.count || 0;
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
    const result = await connection.query(
      `SELECT DISTINCT c.* FROM customers c
       INNER JOIN topics t ON c.id = t.customer_id
       WHERE t.date_created >= $1`,
      [cutoffDate]
    );

    return result.rows.map(row => this.mapToCustomer(row as unknown as CustomerData));
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
      new Date(data.date_created),
      data.tier as CustomerTier
    );
  }
} 