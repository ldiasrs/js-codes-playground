import Datastore from 'nedb';
import { ScheduledTask, TaskType, TaskStatus } from '../../domain/scheduling/entities/ScheduledTask';
import { ScheduledTaskRepositoryPort, ScheduledTaskSearchCriteria } from '../../domain/scheduling/ports/ScheduledTaskRepositoryPort';
import { NedbDatabaseManager } from '../database/NedbDatabaseManager';
import moment from 'moment';

interface ScheduledTaskData {
  _id?: string;
  taskType: string;
  taskData: any;
  cronExpression: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  errorMessage?: string;
  isActive: boolean;
}

export class NedbScheduledTaskRepository implements ScheduledTaskRepositoryPort {
  private readonly scheduledTaskDb: Datastore;

  constructor(dataDir: string) {
    const dbManager = NedbDatabaseManager.getInstance({ dataDir });
    this.scheduledTaskDb = dbManager.getScheduledTaskDatabase();
  }

  private scheduledTaskToData(scheduledTask: ScheduledTask): ScheduledTaskData {
    return {
      _id: scheduledTask.id,
      taskType: scheduledTask.taskType,
      taskData: scheduledTask.taskData,
      cronExpression: scheduledTask.cronExpression,
      status: scheduledTask.status,
      createdAt: scheduledTask.createdAt.toISOString(),
      updatedAt: scheduledTask.updatedAt.toISOString(),
      lastRunAt: scheduledTask.lastRunAt?.toISOString(),
      nextRunAt: scheduledTask.nextRunAt?.toISOString(),
      errorMessage: scheduledTask.errorMessage,
      isActive: scheduledTask.isActive
    };
  }

  private dataToScheduledTask(data: ScheduledTaskData): ScheduledTask {
    return new ScheduledTask(
      data.taskType as TaskType,
      data.taskData,
      data.cronExpression,
      data._id!,
      data.status as TaskStatus,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.lastRunAt ? new Date(data.lastRunAt) : undefined,
      data.nextRunAt ? new Date(data.nextRunAt) : undefined,
      data.errorMessage,
      data.isActive
    );
  }

  async save(scheduledTask: ScheduledTask): Promise<ScheduledTask> {
    return new Promise((resolve, reject) => {
      const taskData = this.scheduledTaskToData(scheduledTask);
      
      this.scheduledTaskDb.update(
        { _id: scheduledTask.id },
        taskData,
        { upsert: true },
        (err, numReplaced) => {
          if (err) {
            reject(err);
          } else {
            resolve(scheduledTask);
          }
        }
      );
    });
  }

  async findById(id: string): Promise<ScheduledTask | undefined> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.findOne({ _id: id }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc ? this.dataToScheduledTask(doc) : undefined);
        }
      });
    });
  }

  async findAll(): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToScheduledTask(doc)));
        }
      });
    });
  }

  async findByTaskType(taskType: TaskType): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find({ taskType }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToScheduledTask(doc)));
        }
      });
    });
  }

  async findByStatus(status: TaskStatus): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find({ status }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToScheduledTask(doc)));
        }
      });
    });
  }

  async findActive(): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find({ isActive: true }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToScheduledTask(doc)));
        }
      });
    });
  }

  async findPendingTasks(): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find(
        { status: 'pending', isActive: true },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToScheduledTask(doc)));
          }
        }
      );
    });
  }

  async findTasksToRun(beforeDate: Date): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find(
        {
          status: 'pending',
          isActive: true,
          $or: [
            { nextRunAt: { $lte: beforeDate.toISOString() } },
            { nextRunAt: { $exists: false } }
          ]
        },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToScheduledTask(doc)));
          }
        }
      );
    });
  }

  async search(criteria: ScheduledTaskSearchCriteria): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      const query: any = {};

      if (criteria.taskType) {
        query.taskType = criteria.taskType;
      }

      if (criteria.status) {
        query.status = criteria.status;
      }

      if (criteria.isActive !== undefined) {
        query.isActive = criteria.isActive;
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

      this.scheduledTaskDb.find(query, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToScheduledTask(doc)));
        }
      });
    });
  }

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.remove({ _id: id }, {}, (err, numRemoved) => {
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
      this.scheduledTaskDb.count({}, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }

  async getTasksCreatedToday(): Promise<ScheduledTask[]> {
    const today = moment().startOf('day');
    const tomorrow = moment().endOf('day');
    
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find(
        {
          createdAt: {
            $gte: today.toISOString(),
            $lte: tomorrow.toISOString()
          }
        },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToScheduledTask(doc)));
          }
        }
      );
    });
  }

  async getTasksCreatedThisWeek(): Promise<ScheduledTask[]> {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find(
        {
          createdAt: {
            $gte: weekStart.toISOString(),
            $lte: weekEnd.toISOString()
          }
        },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToScheduledTask(doc)));
          }
        }
      );
    });
  }

  async getTasksCreatedThisMonth(): Promise<ScheduledTask[]> {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find(
        {
          createdAt: {
            $gte: monthStart.toISOString(),
            $lte: monthEnd.toISOString()
          }
        },
        (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.map(doc => this.dataToScheduledTask(doc)));
          }
        }
      );
    });
  }

  async getFailedTasks(): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find({ status: 'failed' }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToScheduledTask(doc)));
        }
      });
    });
  }

  async getCompletedTasks(): Promise<ScheduledTask[]> {
    return new Promise((resolve, reject) => {
      this.scheduledTaskDb.find({ status: 'completed' }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(doc => this.dataToScheduledTask(doc)));
        }
      });
    });
  }
} 