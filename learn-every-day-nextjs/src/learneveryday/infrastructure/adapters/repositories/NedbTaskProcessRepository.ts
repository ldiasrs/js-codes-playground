import 'reflect-metadata';
import { injectable } from 'inversify';
import Datastore from 'nedb';
import { TaskProcess, TaskProcessType, TaskProcessStatus } from '../../../domain/taskprocess/entities/TaskProcess';
import { TaskProcessRepositoryPort, TaskProcessSearchCriteria } from '../../../domain/taskprocess/ports/TaskProcessRepositoryPort';
import { NedbDatabaseManager } from '../../database/NedbDatabaseManager';
import moment from 'moment';

interface TaskProcessData {
  _id?: string;
  entityId: string;
  customerId: string;
  type: TaskProcessType;
  status: TaskProcessStatus;
  errorMsg?: string;
  scheduledTo?: string;
  processAt?: string;
  createdAt: string;
}

@injectable()
export class NedbTaskProcessRepository implements TaskProcessRepositoryPort {
  private db: Datastore;

  constructor() {
    const dbManager = NedbDatabaseManager.getInstance();
    this.db = dbManager.getTaskProcessDatabase();
  }

  private taskProcessToData(taskProcess: TaskProcess): TaskProcessData {
    return {
      _id: taskProcess.id,
      entityId: taskProcess.entityId,
      customerId: taskProcess.customerId,
      type: taskProcess.type,
      status: taskProcess.status,
      errorMsg: taskProcess.errorMsg,
      scheduledTo: taskProcess.scheduledTo?.toISOString(),
      processAt: taskProcess.processAt?.toISOString(),
      createdAt: taskProcess.createdAt.toISOString()
    };
  }

  private dataToTaskProcess(data: TaskProcessData): TaskProcess {
    return new TaskProcess(
      data.entityId,
      data.customerId,
      data.type,
      data.status,
      data._id!,
      data.errorMsg,
      data.scheduledTo ? new Date(data.scheduledTo) : undefined,
      data.processAt ? new Date(data.processAt) : undefined,
      new Date(data.createdAt)
    );
  }

  async save(taskProcess: TaskProcess): Promise<TaskProcess> {
    return new Promise((resolve, reject) => {
      const processData = this.taskProcessToData(taskProcess);
      
      this.db.update(
        { _id: taskProcess.id },
        processData,
        { upsert: true },
        (err, numReplaced) => {
          if (err) {
            reject(err);
          } else {
            resolve(taskProcess);
          }
        }
      );
    });
  }

  async findById(id: string): Promise<TaskProcess | undefined> {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: id }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc ? this.dataToTaskProcess(doc) : undefined);
        }
      });
    });
  }

  async findAll(): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
        }
      });
    });
  }

  async findByEntityId(entityId: string): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ entityId }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
        }
      });
    });
  }

  async findByCustomerId(customerId: string): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ customerId }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
        }
      });
    });
  }

  async findByType(type: TaskProcessType): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ type }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
        }
      });
    });
  }

  async findByStatus(status: TaskProcessStatus): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ status }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
        }
      });
    });
  }

  async findByEntityIdAndType(entityId: string, type: TaskProcessType): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ entityId, type }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
        }
      });
    });
  }

  async findPendingTasks(): Promise<TaskProcess[]> {
    return this.findByStatus('pending');
  }

  async findRunningTasks(): Promise<TaskProcess[]> {
    return this.findByStatus('running');
  }

  async findScheduledTasks(): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      this.db.find({ scheduledTo: { $exists: true, $ne: null } }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
        }
      });
    });
  }

  async findFailedTasks(): Promise<TaskProcess[]> {
    return this.findByStatus('failed');
  }

  async findPendingTaskProcessByStatusAndType(status: TaskProcessStatus, type: TaskProcessType, limit: number = 10): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      const nowISOString = new Date().toISOString();
      this.db.find(
        {
          status,
          type,
          $or: [
            { scheduledTo: { $exists: false } },
            { scheduledTo: null },
            { scheduledTo: { $lte: nowISOString } }
          ]
        },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            const taskProcesses = docs.map(doc => this.dataToTaskProcess(doc));
              
            resolve(taskProcesses);
          }
        }
      );
    });
  }

  async search(criteria: TaskProcessSearchCriteria): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      const query: any = {};

      if (criteria.entityId) {
        query.entityId = criteria.entityId;
      }

      if (criteria.customerId) {
        query.customerId = criteria.customerId;
      }

      if (criteria.type) {
        query.type = criteria.type;
      }

      if (criteria.status) {
        query.status = criteria.status;
      }

      if (criteria.dateFrom || criteria.dateTo) {
        query.createdAt = {};
        if (criteria.dateFrom) {
          query.createdAt.$gte = criteria.dateFrom.toISOString();
        }
        if (criteria.dateTo) {
          query.createdAt.$lte = criteria.dateTo.toISOString();
        }
      }

      if (criteria.scheduledTo) {
        query.scheduledTo = criteria.scheduledTo.toISOString();
      }

      if (criteria.processAt) {
        query.processAt = criteria.processAt.toISOString();
      }

      this.db.find(query, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToTaskProcess(doc)));
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

  async deleteByEntityId(entityId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.remove({ entityId }, { multi: true }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.remove({ customerId }, { multi: true }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve();
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

  async countByStatus(status: TaskProcessStatus): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.count({ status }, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }

  async countByType(type: TaskProcessType): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.count({ type }, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }

  async getTasksCreatedToday(): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      const today = moment().startOf('day').toISOString();
      const tomorrow = moment().endOf('day').toISOString();
      
      this.db.find(
        { createdAt: { $gte: today, $lte: tomorrow } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTaskProcess(doc)));
          }
        }
      );
    });
  }

  async getTasksCreatedThisWeek(): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      const weekStart = moment().startOf('week').toISOString();
      const weekEnd = moment().endOf('week').toISOString();
      
      this.db.find(
        { createdAt: { $gte: weekStart, $lte: weekEnd } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTaskProcess(doc)));
          }
        }
      );
    });
  }

  async getTasksCreatedThisMonth(): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      const monthStart = moment().startOf('month').toISOString();
      const monthEnd = moment().endOf('month').toISOString();
      
      this.db.find(
        { createdAt: { $gte: monthStart, $lte: monthEnd } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTaskProcess(doc)));
          }
        }
      );
    });
  }

  async getTasksScheduledForDate(date: Date): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      const dateStart = moment(date).startOf('day').toISOString();
      const dateEnd = moment(date).endOf('day').toISOString();
      
      this.db.find(
        { scheduledTo: { $gte: dateStart, $lte: dateEnd } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTaskProcess(doc)));
          }
        }
      );
    });
  }

  async getTasksScheduledForDateRange(dateFrom: Date, dateTo: Date): Promise<TaskProcess[]> {
    return new Promise((resolve, reject) => {
      const fromDate = moment(dateFrom).startOf('day').toISOString();
      const toDate = moment(dateTo).endOf('day').toISOString();
      
      this.db.find(
        { scheduledTo: { $gte: fromDate, $lte: toDate } },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToTaskProcess(doc)));
          }
        }
      );
    });
  }
} 