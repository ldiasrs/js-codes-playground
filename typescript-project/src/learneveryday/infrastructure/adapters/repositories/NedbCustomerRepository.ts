import 'reflect-metadata';
import { injectable } from 'inversify';
import Datastore from 'nedb';
import { Customer } from '../../domain/customer/entities/Customer';
import { CustomerRepositoryPort, CustomerSearchCriteria } from '../../domain/customer/ports/CustomerRepositoryPort';
import { GovIdentificationType } from '../../domain/shared/GovIdentification';
import { NedbDatabaseManager } from '../database/NedbDatabaseManager';
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

@injectable()
export class NedbCustomerRepository implements CustomerRepositoryPort {
  private db: Datastore;
  private readonly topicDb: Datastore;
  private readonly topicHistoryDb: Datastore;

  constructor() {
    this.db = NedbDatabaseManager.getInstance().getCustomerDatabase();
    this.topicDb = NedbDatabaseManager.getInstance().getTopicDatabase();
    this.topicHistoryDb = NedbDatabaseManager.getInstance().getTopicHistoryDatabase();
  }

  private customerToData(customer: Customer): CustomerData {
    return {
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
  }

  private dataToCustomer(data: CustomerData): Customer {
    return new Customer(
      data.customerName,
      { 
        type: data.govIdentification.type as GovIdentificationType, 
        content: data.govIdentification.content 
      },
      data.email,
      data.phoneNumber,
      data._id!,
      new Date(data.dateCreated)
    );
  }

  async save(customer: Customer): Promise<Customer> {
    return new Promise((resolve, reject) => {
      const customerData = this.customerToData(customer);
      
      this.db.update(
        { _id: customer.id },
        customerData,
        { upsert: true },
        (err, numReplaced) => {
          if (err) {
            reject(err);
          } else {
            resolve(customer);
          }
        }
      );
    });
  }

  async findById(id: string): Promise<Customer | undefined> {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: id }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc ? this.dataToCustomer(doc) : undefined);
        }
      });
    });
  }

  async findAll(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToCustomer(doc)));
        }
      });
    });
  }

  async findByCustomerName(customerName: string): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.db.find(
        { customerName: { $regex: new RegExp(customerName, 'i') } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToCustomer(doc)));
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
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc ? this.dataToCustomer(doc) : undefined);
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
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToCustomer(doc)));
          }
        }
      );
    });
  }

  async search(criteria: CustomerSearchCriteria): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      const query: any = {};

      if (criteria.customerName) {
        query.customerName = { $regex: new RegExp(criteria.customerName, 'i') };
      }

      if (criteria.govIdentification) {
        if (criteria.govIdentification.type) {
          query['govIdentification.type'] = criteria.govIdentification.type;
        }
        if (criteria.govIdentification.content) {
          query['govIdentification.content'] = { $regex: new RegExp(criteria.govIdentification.content, 'i') };
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

      this.db.find(query, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToCustomer(doc)));
        }
      });
    });
  }

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.remove({ _id: id }, {}, (err, numRemoved) => {
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
      this.db.count({}, (err, count) => {
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
        (err, topicDocs) => {
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
              (err, customerDocs) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(customerDocs.map(doc => this.dataToCustomer(doc)));
                }
              }
            );
          }
        }
      );
    });
  }
} 