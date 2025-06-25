import Datastore from 'nedb';
import { Customer } from '../../../domain/customer/entities/Customer';
import { CustomerRepositoryPort, CustomerSearchCriteria } from '../../../domain/customer/ports/CustomerRepositoryPort';
import { GovIdentificationType } from '../../../domain/shared/GovIdentification';
import { NedbDatabaseManager } from '../../database/NedbDatabaseManager';
import moment from 'moment';

interface CustomerData {
  _id?: string;
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
  dateCreated: string;
}

export class NedbCustomerRepository implements CustomerRepositoryPort {
  private db: Datastore<CustomerData>;
  private readonly topicDb: Datastore;
  private readonly topicHistoryDb: Datastore;

  constructor() {
    this.db = NedbDatabaseManager.getInstance().getCustomerDatabase();
    this.topicDb = NedbDatabaseManager.getInstance().getTopicDatabase();
    this.topicHistoryDb = NedbDatabaseManager.getInstance().getTopicHistoryDatabase();
  }

  async save(customer: Customer): Promise<Customer> {
    const customerData: CustomerData = {
      _id: customer.id,
      customerName: customer.customerName,
      govIdentification: {
        type: customer.govIdentification.type,
        content: customer.govIdentification.content
      },
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      dateCreated: customer.dateCreated.toISOString()
    };

    return new Promise((resolve, reject) => {
      this.db.update({ _id: customer.id }, customerData, { upsert: true }, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(customer);
        }
      });
    });
  }

  async findById(id: string): Promise<Customer | undefined> {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: id }, (err: any, doc: CustomerData) => {
        if (err) {
          reject(err);
        } else if (!doc) {
          resolve(undefined);
        } else {
          resolve(this.mapToCustomer(doc));
        }
      });
    });
  }

  async findAll(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err: any, docs: CustomerData[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.mapToCustomer(doc)));
        }
      });
    });
  }

  async findByCustomerName(customerName: string): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.db.find(
        { customerName: { $regex: new RegExp(customerName, 'i') } },
        (err: any, docs: CustomerData[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.mapToCustomer(doc)));
          }
        }
      );
    });
  }

  async findByGovIdentification(govIdentification: { type: string; content: string }): Promise<Customer | undefined> {
    return new Promise((resolve, reject) => {
      this.db.findOne(
        {
          'govIdentification.type': govIdentification.type,
          'govIdentification.content': govIdentification.content
        },
        (err: any, doc: CustomerData) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc ? this.mapToCustomer(doc) : undefined);
          }
        }
      );
    });
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.db.find(
        {
          dateCreated: {
            $gte: dateFrom.toISOString(),
            $lte: dateTo.toISOString()
          }
        },
        (err: any, docs: CustomerData[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.mapToCustomer(doc)));
          }
        }
      );
    });
  }

  async search(criteria: CustomerSearchCriteria): Promise<Customer[]> {
    const query: any = {};

    if (criteria.customerName) {
      query.customerName = { $regex: criteria.customerName, $options: 'i' };
    }

    if (criteria.govIdentification) {
      if (criteria.govIdentification.type) {
        query['govIdentification.type'] = criteria.govIdentification.type;
      }
      if (criteria.govIdentification.content) {
        query['govIdentification.content'] = { $regex: criteria.govIdentification.content, $options: 'i' };
      }
    }

    if (criteria.dateFrom || criteria.dateTo) {
      query.dateCreated = {};
      if (criteria.dateFrom) {
        query.dateCreated.$gte = criteria.dateFrom.toISOString();
      }
      if (criteria.dateTo) {
        query.dateCreated.$lte = criteria.dateTo.toISOString();
      }
    }

    return new Promise((resolve, reject) => {
      this.db.find(query, (err: any, docs: CustomerData[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.mapToCustomer(doc)));
        }
      });
    });
  }

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.remove({ _id: id }, {}, (err: any, numRemoved: number) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved > 0);
        }
      });
    });
  }

  async count(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.count({}, (err: any, count: number) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
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
    return new Promise((resolve, reject) => {
      const cutoffDate = moment().subtract(hours, 'hours').toISOString();
      
      // Find customers who have topics created after the cutoff date
      this.topicDb.find(
        { dateCreated: { $gte: cutoffDate } },
        (err: any, topicDocs: any[]) => {
          if (err) {
            reject(err);
          } else {
            const customerIds = [...new Set(topicDocs.map(doc => doc.customerId))];
            
            if (customerIds.length === 0) {
              resolve([]);
              return;
            }

            this.db.find(
              { _id: { $in: customerIds } },
              (err: any, customerDocs: CustomerData[]) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(customerDocs.map(doc => this.mapToCustomer(doc)));
                }
              }
            );
          }
        }
      );
    });
  }

  private mapToCustomer(doc: CustomerData): Customer {
    return new Customer(
      doc.customerName,
      {
        type: doc.govIdentification.type as GovIdentificationType,
        content: doc.govIdentification.content
      },
      doc.email,
      doc.phoneNumber,
      doc._id,
      new Date(doc.dateCreated)
    );
  }
} 