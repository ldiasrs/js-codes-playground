import { DatabaseManager } from '../database/DatabaseManager';
import { TopicHistoryGeneratorFactory } from '../factories/TopicHistoryGeneratorFactory';
import { LoggerFactory } from '../factories/LoggerFactory';

// Repositories
import { SQLCustomerRepository } from '../adapters/repositories/SQLCustomerRepository';
import { SQLTopicRepository } from '../adapters/repositories/SQLTopicRepository';
import { SQLTopicHistoryRepository } from '../adapters/repositories/SQLTopicHistoryRepository';
import { SQLTaskProcessRepository } from '../adapters/repositories/SQLTaskProcessRepository';
import { SQLAuthenticationAttemptRepository } from '../adapters/repositories/SQLAuthenticationAttemptRepository';

// Ports
import { NodemailerTopicHistoryEmailSender } from '../adapters/NodemailerTopicHistoryEmailSender';
import { NodemailerVerificationCodeSender } from '../adapters/NodemailerVerificationCodeSender';

// Use Cases
import { CreateCustomerFeature } from '../../domain/customer/usecase/CreateCustomerFeature';
import { DeleteCustomerFeature } from '../../domain/customer/usecase/DeleteCustomerFeature';
import { AuthCustomerFeature } from '../../domain/customer/usecase/AuthCustomerFeature';
import { VerifyCustomerFeature } from '../../domain/customer/usecase/VerifyCustomerFeature';
import { AddTopicFeature } from '../../domain/topic/usecase/AddTopicFeature';
import { UpdateTopicFeature } from '../../domain/topic/usecase/UpdateTopicFeature';
import { DeleteTopicFeature } from '../../domain/topic/usecase/DeleteTopicFeature';
import { GetAllTopicsFeature } from '../../domain/topic/usecase/GetAllTopicsFeature';
import { GenerateAndEmailTopicHistoryFeature } from '../../domain/topic-history/usecase/GenerateAndEmailTopicHistoryFeature';
import { TasksProcessExecutor } from '../../domain/taskprocess/usecase/TasksProcessExecutor';

// Runners
import { GenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/ReGenerateTopicHistoryTaskRunner';

// Commands
import { CreateCustomerCommand } from '../../application/commands/customer/CreateCustomerCommand';
import { DeleteCustomerCommand } from '../../application/commands/customer/DeleteCustomerCommand';
import { AuthCustomerCommand } from '../../application/commands/customer/AuthCustomerCommand';
import { VerifyCustomerCommand } from '../../application/commands/customer/VerifyCustomerCommand';
import { AddTopicCommand } from '../../application/commands/topic/AddTopicCommand';
import { UpdateTopicCommand } from '../../application/commands/topic/UpdateTopicCommand';
import { DeleteTopicCommand } from '../../application/commands/topic/DeleteTopicCommand';
import { GenerateTopicHistoryCommand } from '../../application/commands/topic-history/GenerateTopicHistoryCommand';
import { ExecuteTaskProcessCommand } from '../../application/commands/taskprocess/ExecuteTaskProcessCommand';
import { ProcessTopicHistoryWorkflowCommand } from '../../application/commands/topic-history/ProcessTopicHistoryWorkflowCommand';

// Queries
import { GetAllTopicsQuery } from '../../application/queries/topic/GetAllTopicsQuery';
import { GetTopicByIdQuery } from '../../application/queries/topic/GetTopicByIdQuery';
import { SearchTopicsQuery } from '../../application/queries/topic/SearchTopicsQuery';

export interface Container {
  get<T>(token: string): T;
  has(token: string): boolean;
  createInstance<T>(token: string, data: unknown): T;
}

export class NextJSContainer implements Container {
  private services = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();
  private commandFactories = new Map<string, (data: unknown) => unknown>();

  constructor() {
    this.initializeServices();
  }

  protected initializeServices(): void {
    // Initialize database manager
    DatabaseManager.getInstance();

    // Register repositories
    this.registerSingleton('CustomerRepository', () => new SQLCustomerRepository());
    this.registerSingleton('TopicRepository', () => new SQLTopicRepository());
    this.registerSingleton('TopicHistoryRepository', () => new SQLTopicHistoryRepository());
    this.registerSingleton('TaskProcessRepository', () => new SQLTaskProcessRepository());
    this.registerSingleton('AuthenticationAttemptRepository', () => new SQLAuthenticationAttemptRepository());

    // Register ports
    this.registerSingleton('GenerateTopicHistoryPort', () => TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv(this.get('Logger')));
    this.registerSingleton('SendTopicHistoryByEmailPort', () => new NodemailerTopicHistoryEmailSender(this.get('Logger')));
    this.registerSingleton('VerificationCodeSender', () => new NodemailerVerificationCodeSender(this.get('Logger')));

    // Register shared services
    this.registerSingleton('Logger', () => LoggerFactory.createLoggerFromEnv());

    // Register use cases
    this.registerSingleton('CreateCustomerFeature', () => new CreateCustomerFeature(
      this.get('CustomerRepository'),
      this.get('TopicRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('DeleteCustomerFeature', () => new DeleteCustomerFeature(
      this.get('CustomerRepository'),
      this.get('TopicRepository')
    ));

    this.registerSingleton('AuthCustomerFeature', () => new AuthCustomerFeature(
      this.get('CustomerRepository'),
      this.get('VerificationCodeSender'),
      this.get('AuthenticationAttemptRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('VerifyCustomerFeature', () => new VerifyCustomerFeature(
      this.get('CustomerRepository'),
      this.get('AuthenticationAttemptRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('AddTopicFeature', () => new AddTopicFeature(
      this.get('TopicRepository'),
      this.get('CustomerRepository'),
      this.get('TaskProcessRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('UpdateTopicFeature', () => new UpdateTopicFeature(
      this.get('TopicRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('DeleteTopicFeature', () => new DeleteTopicFeature(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('GetAllTopicsFeature', () => new GetAllTopicsFeature(
      this.get('TopicRepository'),
      this.get('CustomerRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('GenerateAndEmailTopicHistoryFeature', () => new GenerateAndEmailTopicHistoryFeature(
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('SendTopicHistoryByEmailPort')
    ));

    this.registerSingleton('TasksProcessExecutor', () => new TasksProcessExecutor(
      this.get('TaskProcessRepository'),
      this.get('Logger')
    ));

    // Register runners
    this.registerSingleton('GenerateTopicHistoryTaskRunner', () => new GenerateTopicHistoryTaskRunner(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('GenerateTopicHistoryPort'),
      this.get('TaskProcessRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('SendTopicHistoryTaskRunner', () => new SendTopicHistoryTaskRunner(
      this.get('CustomerRepository'),
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('SendTopicHistoryByEmailPort'),
      this.get('TaskProcessRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('ReGenerateTopicHistoryTaskRunner', () => new ReGenerateTopicHistoryTaskRunner(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      this.get('Logger')
    ));

    // Register commands
    this.registerSingleton('CreateCustomerCommand', () => new CreateCustomerCommand(
      this.get('CreateCustomerFeature')
    ));

    this.registerSingleton('DeleteCustomerCommand', () => new DeleteCustomerCommand(
      this.get('DeleteCustomerFeature')
    ));

    this.registerSingleton('AuthCustomerCommand', () => new AuthCustomerCommand(
      this.get('AuthCustomerFeature')
    ));

    this.registerSingleton('VerifyCustomerCommand', () => new VerifyCustomerCommand(
      this.get('VerifyCustomerFeature')
    ));

    this.registerSingleton('AddTopicCommand', () => new AddTopicCommand(
      this.get('AddTopicFeature')
    ));

    this.registerSingleton('UpdateTopicCommand', () => new UpdateTopicCommand(
      this.get('UpdateTopicFeature')
    ));

    this.registerSingleton('DeleteTopicCommand', () => new DeleteTopicCommand(
      this.get('DeleteTopicFeature')
    ));

    this.registerSingleton('GenerateTopicHistoryCommand', () => new GenerateTopicHistoryCommand(
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('TopicHistoryRepository'),
      this.get('TopicRepository')
    ));

    this.registerSingleton('ExecuteTaskProcessCommand', () => new ExecuteTaskProcessCommand(
      this.get('TaskProcessRepository'),
      this.get('Logger')
    ));

    this.registerSingleton('ProcessTopicHistoryWorkflowCommand', () => new ProcessTopicHistoryWorkflowCommand(
      this.get('ExecuteTaskProcessCommand'),
      this.get('ReGenerateTopicHistoryTaskRunner'),
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('SendTopicHistoryTaskRunner'),
      this.get('Logger')
    ));

    // Register query factories
    this.registerSingleton('GetAllTopicsQuery', () => new GetAllTopicsQuery(
      this.get('GetAllTopicsFeature')
    ));

    this.registerSingleton('GetTopicByIdQuery', () => new GetTopicByIdQuery(
      this.get('TopicRepository')
    ));

    this.registerSingleton('SearchTopicsQuery', () => new SearchTopicsQuery(
      this.get('TopicRepository')
    ));
  }

  protected registerSingleton<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  protected registerCommandFactory<T>(token: string, factory: (data: unknown) => T): void {
    this.commandFactories.set(token, factory);
  }

  protected registerQueryFactory<T>(token: string, factory: (data: unknown) => T): void {
    this.commandFactories.set(token, factory);
  }

  get<T>(token: string): T {
    if (!this.has(token)) {
      throw new Error(`Service not found: ${token}`);
    }

    // For singletons, create and cache the instance
    if (!this.services.has(token)) {
      const factory = this.factories.get(token);
      if (factory) {
        this.services.set(token, factory());
      }
    }

    return this.services.get(token) as T;
  }

  createInstance<T>(token: string, data: unknown): T {
    if (!this.commandFactories.has(token)) {
      throw new Error(`Command factory not found: ${token}`);
    }

    const factory = this.commandFactories.get(token);
    if (!factory) {
      throw new Error(`Command factory is undefined for: ${token}`);
    }

    return factory(data) as T;
  }

  has(token: string): boolean {
    return this.factories.has(token) || this.commandFactories.has(token);
  }

  reset(): void {
    this.services.clear();
    this.factories.clear();
    this.commandFactories.clear();
    this.initializeServices();
  }
}

export class ContainerBuilder {
  private static container: NextJSContainer;

  public static build(): NextJSContainer {
    if (!this.container) {
      this.container = new NextJSContainer();
    }
    return this.container;
  }

  public static reset(): void {
    if (this.container) {
      this.container.reset();
      this.container = null as unknown as NextJSContainer;
    }
  }
} 