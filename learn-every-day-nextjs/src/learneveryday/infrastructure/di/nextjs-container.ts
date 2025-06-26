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
import { UpdateCustomerFeature } from '../../domain/customer/usecase/UpdateCustomerFeature';
import { DeleteCustomerFeature } from '../../domain/customer/usecase/DeleteCustomerFeature';
import { AuthCustomerFeature } from '../../domain/customer/usecase/AuthCustomerFeature';
import { VerifyCustomerFeature } from '../../domain/customer/usecase/VerifyCustomerFeature';
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

// Commands
import { CreateCustomerCommand, CreateCustomerCommandData } from '../../application/commands/customer/CreateCustomerCommand';
import { UpdateCustomerCommand, UpdateCustomerCommandData } from '../../application/commands/customer/UpdateCustomerCommand';
import { DeleteCustomerCommand, DeleteCustomerCommandData } from '../../application/commands/customer/DeleteCustomerCommand';
import { AuthCustomerCommand, AuthCustomerCommandData } from '../../application/commands/customer/AuthCustomerCommand';
import { VerifyCustomerCommand, VerifyCustomerCommandData } from '../../application/commands/customer/VerifyCustomerCommand';
import { AddTopicCommand, AddTopicCommandData } from '../../application/commands/topic/AddTopicCommand';
import { DeleteTopicCommand, DeleteTopicCommandData } from '../../application/commands/topic/DeleteTopicCommand';
import { GenerateTopicHistoryCommand, GenerateTopicHistoryCommandData } from '../../application/commands/topic-history/GenerateTopicHistoryCommand';
import { GenerateAndEmailTopicHistoryCommand, GenerateAndEmailTopicHistoryCommandData } from '../../application/commands/topic-history/GenerateAndEmailTopicHistoryCommand';

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

  private initializeServices(): void {
    // Initialize database manager
    DatabaseManager.getInstance();

    // Register repositories
    this.registerSingleton('CustomerRepository', () => new SQLCustomerRepository());
    this.registerSingleton('TopicRepository', () => new SQLTopicRepository());
    this.registerSingleton('TopicHistoryRepository', () => new SQLTopicHistoryRepository());
    this.registerSingleton('TaskProcessRepository', () => new SQLTaskProcessRepository());
    this.registerSingleton('AuthenticationAttemptRepository', () => new SQLAuthenticationAttemptRepository());

    // Register ports
    this.registerSingleton('GenerateTopicHistoryPort', () => TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv());
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

    this.registerSingleton('UpdateCustomerFeature', () => new UpdateCustomerFeature(
      this.get('CustomerRepository'),
      this.get('TopicRepository')
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

    this.registerSingleton('DeleteTopicFeature', () => new DeleteTopicFeature(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
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

    // Register schedulers
    this.registerSingleton('TriggerTaskProcessExecutorCron', () => new TriggerTaskProcessExecutorCron(
      this.get('TasksProcessExecutor'),
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('SendTopicHistoryTaskRunner'),
      this.get('ReGenerateTopicHistoryTaskRunner'),
      this.get('Logger')
    ));

    // Register command factories
    this.registerCommandFactory('CreateCustomerCommand', (data: unknown) => new CreateCustomerCommand(
      data as CreateCustomerCommandData,
      this.get('CreateCustomerFeature')
    ));

    this.registerCommandFactory('UpdateCustomerCommand', (data: unknown) => new UpdateCustomerCommand(
      data as UpdateCustomerCommandData,
      this.get('UpdateCustomerFeature')
    ));

    this.registerCommandFactory('DeleteCustomerCommand', (data: unknown) => new DeleteCustomerCommand(
      data as DeleteCustomerCommandData,
      this.get('DeleteCustomerFeature')
    ));

    this.registerCommandFactory('AuthCustomerCommand', (data: unknown) => new AuthCustomerCommand(
      data as AuthCustomerCommandData,
      this.get('AuthCustomerFeature')
    ));

    this.registerCommandFactory('VerifyCustomerCommand', (data: unknown) => new VerifyCustomerCommand(
      data as VerifyCustomerCommandData,
      this.get('VerifyCustomerFeature')
    ));

    this.registerCommandFactory('AddTopicCommand', (data: unknown) => new AddTopicCommand(
      data as AddTopicCommandData,
      this.get('AddTopicFeature')
    ));

    this.registerCommandFactory('DeleteTopicCommand', (data: unknown) => new DeleteTopicCommand(
      data as DeleteTopicCommandData,
      this.get('DeleteTopicFeature')
    ));

    this.registerCommandFactory('GenerateTopicHistoryCommand', (data: unknown) => new GenerateTopicHistoryCommand(
      data as GenerateTopicHistoryCommandData,
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('TopicHistoryRepository'),
      this.get('TopicRepository')
    ));

    this.registerCommandFactory('GenerateAndEmailTopicHistoryCommand', (data: unknown) => new GenerateAndEmailTopicHistoryCommand(
      data as GenerateAndEmailTopicHistoryCommandData,
      this.get('GenerateAndEmailTopicHistoryFeature')
    ));
  }

  private registerSingleton<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  private registerCommandFactory<T>(token: string, factory: (data: unknown) => T): void {
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