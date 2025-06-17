import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// Repositories
import { CustomerRepositoryPort } from '../../domain/customer/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../domain/topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { ScheduledTaskRepositoryPort } from '../../domain/scheduling/ports/ScheduledTaskRepositoryPort';
import { NedbCustomerRepository } from '../adapters/NedbCustomerRepository';
import { NedbTopicRepository } from '../adapters/NedbTopicRepository';
import { NedbTopicHistoryRepository } from '../adapters/NedbTopicHistoryRepository';
import { NedbScheduledTaskRepository } from '../adapters/NedbScheduledTaskRepository';

// Ports
import { GenerateTopicHistoryPort } from '../../domain/topic-history/ports/GenerateTopicHistoryPort';
import { SendTopicHistoryByEmailPort } from '../../domain/topic-history/ports/SendTopicHistoryByEmailPort';
import { TopicHistoryGeneratorFactory } from '../factories/TopicHistoryGeneratorFactory';
import { EmailSenderFactory } from '../factories/EmailSenderFactory';

// Services
import { SchedulingService } from '../../domain/scheduling/services/SchedulingService';
import { SchedulingServiceFactory } from '../factories/SchedulingServiceFactory';

// Features
import { CreateCustomerFeature } from '../../domain/customer/features/CreateCustomerFeature';
import { UpdateCustomerFeature } from '../../domain/customer/features/UpdateCustomerFeature';
import { DeleteCustomerFeature } from '../../domain/customer/features/DeleteCustomerFeature';
import { AddTopicFeature } from '../../domain/topic/features/AddTopicFeature';
import { DeleteTopicFeature } from '../../domain/topic/features/DeleteTopicFeature';
import { AddTopicHistoryFeature } from '../../domain/topic-history/features/AddTopicHistoryFeature';
import { GenerateTopicHistoryFeature } from '../../domain/topic-history/features/GenerateTopicHistoryFeature';
import { GenerateAndEmailTopicHistoryFeature } from '../../domain/topic-history/features/GenerateAndEmailTopicHistoryFeature';
import { SendTopicHistoryFeature } from '../../domain/topic-history/features/SendTopicHistoryFeature';

// Database
import { NedbDatabaseManager } from '../database/NedbDatabaseManager';

export class ContainerBuilder {
  private static container: Container;

  public static build(dataDir: string = './data/production/led'): Container {
    if (this.container) {
      return this.container;
    }

    this.container = new Container();

    // Initialize database manager
    NedbDatabaseManager.getInstance({ dataDir });

    // Bind repositories
    this.container.bind<CustomerRepositoryPort>(TYPES.CustomerRepository)
      .to(NedbCustomerRepository)
      .inSingletonScope();

    this.container.bind<TopicRepositoryPort>(TYPES.TopicRepository)
      .to(NedbTopicRepository)
      .inSingletonScope();

    this.container.bind<TopicHistoryRepositoryPort>(TYPES.TopicHistoryRepository)
      .to(NedbTopicHistoryRepository)
      .inSingletonScope();

    this.container.bind<ScheduledTaskRepositoryPort>(TYPES.ScheduledTaskRepository)
      .to(NedbScheduledTaskRepository)
      .inSingletonScope();

    // Bind ports
    this.container.bind<GenerateTopicHistoryPort>(TYPES.GenerateTopicHistoryPort)
      .toDynamicValue(() => TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv())
      .inSingletonScope();

    this.container.bind<SendTopicHistoryByEmailPort>(TYPES.SendTopicHistoryByEmailPort)
      .toDynamicValue(() => EmailSenderFactory.createNodemailerSender())
      .inSingletonScope();

    // Bind features
    this.container.bind<CreateCustomerFeature>(TYPES.CreateCustomerFeature)
      .to(CreateCustomerFeature)
      .inSingletonScope();

    this.container.bind<UpdateCustomerFeature>(TYPES.UpdateCustomerFeature)
      .to(UpdateCustomerFeature)
      .inSingletonScope();

    this.container.bind<DeleteCustomerFeature>(TYPES.DeleteCustomerFeature)
      .to(DeleteCustomerFeature)
      .inSingletonScope();

    this.container.bind<AddTopicFeature>(TYPES.AddTopicFeature)
      .to(AddTopicFeature)
      .inSingletonScope();

    this.container.bind<DeleteTopicFeature>(TYPES.DeleteTopicFeature)
      .to(DeleteTopicFeature)
      .inSingletonScope();

    this.container.bind<AddTopicHistoryFeature>(TYPES.AddTopicHistoryFeature)
      .to(AddTopicHistoryFeature)
      .inSingletonScope();

    this.container.bind<GenerateTopicHistoryFeature>(TYPES.GenerateTopicHistoryFeature)
      .to(GenerateTopicHistoryFeature)
      .inSingletonScope();

    this.container.bind<GenerateAndEmailTopicHistoryFeature>(TYPES.GenerateAndEmailTopicHistoryFeature)
      .to(GenerateAndEmailTopicHistoryFeature)
      .inSingletonScope();

    this.container.bind<SendTopicHistoryFeature>(TYPES.SendTopicHistoryFeature)
      .to(SendTopicHistoryFeature)
      .inSingletonScope();

    // Bind services
    this.container.bind<SchedulingService>(TYPES.SchedulingService)
      .toDynamicValue(() => SchedulingServiceFactory.create(dataDir))
      .inSingletonScope();

    return this.container;
  }

  public static getContainer(): Container {
    if (!this.container) {
      throw new Error('Container not built. Call build() first.');
    }
    return this.container;
  }

  public static reset(): void {
    if (this.container) {
      this.container.unbindAll();
      this.container = null as any;
    }
  }
} 