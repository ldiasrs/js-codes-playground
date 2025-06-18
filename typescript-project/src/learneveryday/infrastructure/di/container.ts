import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// Repositories
import { CustomerRepositoryPort } from '../../domain/customer/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../domain/topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { TaskProcessRepositoryPort } from '../../domain/taskprocess/ports/TaskProcessRepositoryPort';
import { NedbCustomerRepository } from '../adapters/NedbCustomerRepository';
import { NedbTopicRepository } from '../adapters/NedbTopicRepository';
import { NedbTopicHistoryRepository } from '../adapters/NedbTopicHistoryRepository';
import { NedbTaskProcessRepository } from '../adapters/NedbTaskProcessRepository';

// Ports
import { GenerateTopicHistoryPort } from '../../domain/topic-history/ports/GenerateTopicHistoryPort';
import { SendTopicHistoryByEmailPort } from '../../domain/topic-history/ports/SendTopicHistoryByEmailPort';
import { TopicHistoryGeneratorFactory } from '../factories/TopicHistoryGeneratorFactory';
import { EmailSenderFactory } from '../factories/EmailSenderFactory';

// Use Cases
import { CreateCustomerFeature } from '../../domain/customer/usecase/CreateCustomerFeature';
import { UpdateCustomerFeature } from '../../domain/customer/usecase/UpdateCustomerFeature';
import { DeleteCustomerFeature } from '../../domain/customer/usecase/DeleteCustomerFeature';
import { AddTopicFeature } from '../../domain/topic/usecase/AddTopicFeature';
import { DeleteTopicFeature } from '../../domain/topic/usecase/DeleteTopicFeature';
import { GenerateAndEmailTopicHistoryFeature } from '../../domain/topic-history/usecase/GenerateAndEmailTopicHistoryFeature';
import { TasksProcessExecutor } from '../../domain/taskprocess/usecase/TasksProcessExecutor';

// Runners
import { GenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/ReGenerateTopicHistoryTaskRunner';

// Schedulers
import { TriggerTaskProcessExecutorCron } from '../scheduler/TriggerTaskProcessExecutorCron';

// Database
import { NedbDatabaseManager } from '../database/NedbDatabaseManager';

// Commands
import { CreateCustomerCommand } from '../../application/commands/customer/CreateCustomerCommand';
import { UpdateCustomerCommand } from '../../application/commands/customer/UpdateCustomerCommand';
import { DeleteCustomerCommand } from '../../application/commands/customer/DeleteCustomerCommand';
import { AddTopicCommand } from '../../application/commands/topic/AddTopicCommand';
import { DeleteTopicCommand } from '../../application/commands/topic/DeleteTopicCommand';
import { GenerateTopicHistoryCommand } from '../../application/commands/topic-history/GenerateTopicHistoryCommand';
import { GenerateAndEmailTopicHistoryCommand } from '../../application/commands/topic-history/GenerateAndEmailTopicHistoryCommand';

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

    this.container.bind<TaskProcessRepositoryPort>(TYPES.TaskProcessRepository)
      .to(NedbTaskProcessRepository)
      .inSingletonScope();

    // Bind ports
    this.container.bind<GenerateTopicHistoryPort>(TYPES.GenerateTopicHistoryPort)
      .toDynamicValue(() => TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv())
      .inSingletonScope();

    this.container.bind<SendTopicHistoryByEmailPort>(TYPES.SendTopicHistoryByEmailPort)
      .toDynamicValue(() => EmailSenderFactory.createNodemailerSender())
      .inSingletonScope();

    // Bind use cases
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

    this.container.bind<GenerateAndEmailTopicHistoryFeature>(TYPES.GenerateAndEmailTopicHistoryFeature)
      .to(GenerateAndEmailTopicHistoryFeature)
      .inSingletonScope();

    this.container.bind<TasksProcessExecutor>(TYPES.TasksProcessExecutor)
      .to(TasksProcessExecutor)
      .inSingletonScope();

    // Bind runners
    this.container.bind<GenerateTopicHistoryTaskRunner>(TYPES.GenerateTopicHistoryTaskRunner)
      .to(GenerateTopicHistoryTaskRunner)
      .inSingletonScope();

    this.container.bind<SendTopicHistoryTaskRunner>(TYPES.SendTopicHistoryTaskRunner)
      .to(SendTopicHistoryTaskRunner)
      .inSingletonScope();

    this.container.bind<ReGenerateTopicHistoryTaskRunner>(TYPES.ScheduleGenerateTopicHistoryTaskRunner)
      .to(ReGenerateTopicHistoryTaskRunner)
      .inSingletonScope();

    // Bind schedulers
    this.container.bind<TriggerTaskProcessExecutorCron>(TYPES.TriggerTaskProcessExecutorCron)
      .to(TriggerTaskProcessExecutorCron)
      .inSingletonScope();

    // Bind commands
    this.container.bind<CreateCustomerCommand>(TYPES.CreateCustomerCommand)
      .to(CreateCustomerCommand)
      .inSingletonScope();

    this.container.bind<UpdateCustomerCommand>(TYPES.UpdateCustomerCommand)
      .to(UpdateCustomerCommand)
      .inSingletonScope();

    this.container.bind<DeleteCustomerCommand>(TYPES.DeleteCustomerCommand)
      .to(DeleteCustomerCommand)
      .inSingletonScope();

    this.container.bind<AddTopicCommand>(TYPES.AddTopicCommand)
      .to(AddTopicCommand)
      .inSingletonScope();

    this.container.bind<DeleteTopicCommand>(TYPES.DeleteTopicCommand)
      .to(DeleteTopicCommand)
      .inSingletonScope();

    this.container.bind<GenerateTopicHistoryCommand>(TYPES.GenerateTopicHistoryCommand)
      .to(GenerateTopicHistoryCommand)
      .inSingletonScope();

    this.container.bind<GenerateAndEmailTopicHistoryCommand>(TYPES.GenerateAndEmailTopicHistoryCommand)
      .to(GenerateAndEmailTopicHistoryCommand)
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