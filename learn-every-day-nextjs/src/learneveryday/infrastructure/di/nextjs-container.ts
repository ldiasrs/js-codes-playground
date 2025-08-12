import { DatabaseManager } from '../database/DatabaseManager';
import { AIPromptExecutorFactory } from '../factories/AIPromptExecutorFactory';
import { LoggerFactory } from '../factories/LoggerFactory';
import { PromptBuilder } from '../../domain/topic-history/services/PromptBuilder';

// Repositories
import { SQLCustomerRepository } from '../adapters/repositories/SQLCustomerRepository';
import { SQLTopicRepository } from '../adapters/repositories/SQLTopicRepository';
import { SQLTopicHistoryRepository } from '../adapters/repositories/SQLTopicHistoryRepository';
import { SQLTaskProcessRepository } from '../adapters/repositories/SQLTaskProcessRepository';
import { SQLAuthenticationAttemptRepository } from '../adapters/repositories/SQLAuthenticationAttemptRepository';
import { SQLLogRepository } from '../adapters/repositories/SQLLogRepository';

// Ports
import { NodemailerTopicHistoryEmailSender } from '../adapters/NodemailerTopicHistoryEmailSender';
import { NodemailerVerificationCodeSender } from '../adapters/NodemailerVerificationCodeSender';
import { NodemailerTopicClosedEmailSender } from '../adapters/NodemailerTopicClosedEmailSender';

// Use Cases
import { CreateCustomerFeature } from '../../domain/customer/usecase/CreateCustomerFeature';
import { DeleteCustomerFeature } from '../../domain/customer/usecase/DeleteCustomerFeature';
import { LoginFeature } from '../../domain/customer/usecase/LoginFeature';
import { AddTopicFeature } from '../../domain/topic/usecase/AddTopicFeature';
import { UpdateTopicFeature } from '../../domain/topic/usecase/UpdateTopicFeature';
import { CloseTopicFeature } from '../../domain/topic/usecase/CloseTopicFeature';
import { DeleteTopicFeature } from '../../domain/topic/usecase/DeleteTopicFeature';
import { GetAllTopicsFeature } from '../../domain/topic/usecase/GetAllTopicsFeature';
import { ProcessTopicHistoryWorkflowFeature } from '../../domain/topic-history/usecase/ProcessTopicHistoryWorkflowFeature';
import { GetTopicHistoriesFeature } from '../../domain/topic-history/usecase/GetTopicHistoriesFeature';
import { GenerateAndSaveTopicHistoryFeature } from '../../domain/topic-history/usecase/generate-topic-history/GenerateAndSaveTopicHistoryFeature';
import { SendTopicHistoryTaskScheduler } from '../../domain/topic-history/usecase/generate-topic-history/schedulers/SendTopicHistoryTaskScheduler';
import { ReGenerateTopicsTaskScheduler } from '../../domain/topic-history/usecase/generate-topic-history/schedulers/ReGenerateTopicsTaskScheduler';
import { CloseTopicTaskScheduler } from '../../domain/topic-history/usecase/generate-topic-history/schedulers/CloseTopicTaskScheduler';
import { ProcessFailedTopicsTaskScheduler } from '../../domain/topic-history/usecase/generate-topic-history/schedulers/ProcessFailedTopicsTaskScheduler';
import { TasksProcessExecutor } from '../../domain/taskprocess/usecase/TasksProcessExecutor';

// Runners
import { GenerateTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/generate-topic-history/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from '../../domain/topic-history/usecase/SendTopicHistoryTaskRunner';
import { CloseTopicsTaskRunner } from '../../domain/topic-history/usecase/close-topic/CloseTopicsTaskRunner';
import { CheckAndCloseTopicsWithManyHistoriesFeature } from '../../domain/topic-history/usecase/close-topic/CheckAndCloseTopicsWithManyHistoriesFeature';
import { RemoveTasksFromClosedTopicsFeature } from '../../domain/topic-history/usecase/close-topic/RemoveTasksFromClosedTopicsFeature';
import { ProcessFailedTopicsTaskRunner } from '../../domain/topic-history/usecase/ProcessFailedTopicsTaskRunner';

// Commands
import { CreateCustomerCommand } from '../../application/commands/customer/CreateCustomerCommand';
import { DeleteCustomerCommand } from '../../application/commands/customer/DeleteCustomerCommand';
import { LoginCommand } from '../../application/commands/customer/LoginCommand';
import { VerifyCustomerCommand } from '../../application/commands/customer/VerifyCustomerCommand';
import { AddTopicCommand } from '../../application/commands/topic/AddTopicCommand';
import { UpdateTopicCommand } from '../../application/commands/topic/UpdateTopicCommand';
import { CloseTopicCommand } from '../../application/commands/topic/CloseTopicCommand';
import { DeleteTopicCommand } from '../../application/commands/topic/DeleteTopicCommand';
import { ProcessTopicHistoryWorkflowCommand } from '../../application/commands/topic-history/ProcessTopicHistoryWorkflowCommand';

// Queries
import { GetAllTopicsQuery } from '../../application/queries/topic/GetAllTopicsQuery';
import { GetTopicByIdQuery } from '../../application/queries/topic/GetTopicByIdQuery';
import { SearchTopicsQuery } from '../../application/queries/topic/SearchTopicsQuery';
import { GetTopicHistoriesQuery } from '../../application/queries/topic/GetTopicHistoriesQuery';
import { ReGenerateTopicHistoryTaskRunner } from '@/learneveryday/domain/topic-history/usecase/ReGenerateTopicHistoryTaskRunner';
import { VerifyAuthCodeFeature } from '@/learneveryday/domain/customer/usecase/VerifyAuthCodeFeature';

// Infrastructure Services
import { ProcessInfrastuctureWorkflow } from '../services/ProcessInfrastuctureWorkflow';
import { CleanOldLogsProcess } from '../adapters/loggers/CleanOldLogsProcess';

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
    this.registerSingleton('LogRepository', () => new SQLLogRepository());

    // Register ports
    this.registerSingleton('AIPromptExecutorPort', () => AIPromptExecutorFactory.createGeminiExecutor(LoggerFactory.createLoggerForClass('AIPromptExecutor')));
    this.registerSingleton('PromptBuilder', () => new PromptBuilder(LoggerFactory.createLoggerForClass('PromptBuilder')));
    this.registerSingleton('SendTopicHistoryByEmailPort', () => new NodemailerTopicHistoryEmailSender(LoggerFactory.createLoggerForClass('NodemailerTopicHistoryEmailSender')));
    this.registerSingleton('VerificationCodeSender', () => new NodemailerVerificationCodeSender(LoggerFactory.createLoggerForClass('NodemailerVerificationCodeSender')));
    this.registerSingleton('SendTopicClosedEmailPort', () => new NodemailerTopicClosedEmailSender(LoggerFactory.createLoggerForClass('NodemailerTopicClosedEmailSender')));


    // Register infrastructure services
    this.registerSingleton('CleanOldLogsProcess', () => new CleanOldLogsProcess(
      this.get('LogRepository'),
      LoggerFactory.createLoggerForClass('CleanOldLogsProcess')
    ));

    this.registerSingleton('ProcessInfrastuctureWorkflow', () => new ProcessInfrastuctureWorkflow(
      this.get('CleanOldLogsProcess'),
      LoggerFactory.createLoggerForClass('ProcessInfrastuctureWorkflow')
    ));

    // Register use cases
    this.registerSingleton('CreateCustomerFeature', () => new CreateCustomerFeature(
      this.get('CustomerRepository'),
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('CreateCustomerFeature')
    ));

    this.registerSingleton('DeleteCustomerFeature', () => new DeleteCustomerFeature(
      this.get('CustomerRepository'),
      this.get('TopicRepository')
    ));

    this.registerSingleton('LoginFeature', () => new LoginFeature(
      this.get('CustomerRepository'),
      this.get('VerificationCodeSender'),
      this.get('AuthenticationAttemptRepository'),
      LoggerFactory.createLoggerForClass('LoginFeature')
    ));

    this.registerSingleton('VerifyAuthCodeFeature', () => new VerifyAuthCodeFeature(
      this.get('CustomerRepository'),
      this.get('AuthenticationAttemptRepository'),
      LoggerFactory.createLoggerForClass('VerifyAuthCodeFeature')
    ));

    this.registerSingleton('AddTopicFeature', () => new AddTopicFeature(
      this.get('TopicRepository'),
      this.get('CustomerRepository'),
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('AddTopicFeature')
    ));

    this.registerSingleton('UpdateTopicFeature', () => new UpdateTopicFeature(
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('UpdateTopicFeature')
    ));

    this.registerSingleton('CloseTopicFeature', () => new CloseTopicFeature(
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('CloseTopicFeature'),
      this.get('CustomerRepository'),
      this.get('SendTopicClosedEmailPort')
    ));

    this.registerSingleton('DeleteTopicFeature', () => new DeleteTopicFeature(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('DeleteTopicFeature')
    ));

    this.registerSingleton('GetAllTopicsFeature', () => new GetAllTopicsFeature(
      this.get('TopicRepository'),
      this.get('CustomerRepository'),
      LoggerFactory.createLoggerForClass('GetAllTopicsFeature')
    ));

    this.registerSingleton('GetTopicHistoriesFeature', () => new GetTopicHistoriesFeature(
      this.get('TopicHistoryRepository'),
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('GetTopicHistoriesFeature')
    ));

    this.registerSingleton('GenerateAndSaveTopicHistoryFeature', () => new GenerateAndSaveTopicHistoryFeature(
      this.get('TopicHistoryRepository'),
      this.get('AIPromptExecutorPort'),
      this.get('PromptBuilder'),
      LoggerFactory.createLoggerForClass('GenerateAndSaveTopicHistoryFeature')
    ));


    this.registerSingleton('ProcessTopicHistoryWorkflowFeature', () => new ProcessTopicHistoryWorkflowFeature(
      this.get('TaskProcessRepository'),
      this.get('ProcessFailedTopicsTaskRunner'),
      this.get('CloseTopicsTaskRunner'),
      this.get('ReGenerateTopicHistoryTaskRunner'),
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('SendTopicHistoryTaskRunner'),
      LoggerFactory.createLoggerForClass('ProcessTopicHistoryWorkflowFeature')
    ));

    this.registerSingleton('TasksProcessExecutor', () => new TasksProcessExecutor(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('TasksProcessExecutor')
    ));

    // Register runners
    // Register schedulers used by GenerateTopicHistoryTaskRunner
    this.registerSingleton('SendTopicHistoryTaskScheduler', () => new SendTopicHistoryTaskScheduler(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('SendTopicHistoryTaskScheduler')
    ));
    this.registerSingleton('ReGenerateTopicsTaskScheduler', () => new ReGenerateTopicsTaskScheduler(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('ReGenerateTopicsTaskScheduler')
    ));
    this.registerSingleton('CloseTopicTaskScheduler', () => new CloseTopicTaskScheduler(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('CloseTopicTaskScheduler')
    ));
    this.registerSingleton('ProcessFailedTopicsTaskScheduler', () => new ProcessFailedTopicsTaskScheduler(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('ProcessFailedTopicsTaskScheduler')
    ));

    this.registerSingleton('GenerateTopicHistoryTaskRunner', () => new GenerateTopicHistoryTaskRunner(
      this.get('TopicRepository'),
      this.get('GenerateAndSaveTopicHistoryFeature'),
      this.get('SendTopicHistoryTaskScheduler'),
      this.get('ReGenerateTopicsTaskScheduler'),
      this.get('CloseTopicTaskScheduler'),
      this.get('ProcessFailedTopicsTaskScheduler'),
      LoggerFactory.createLoggerForClass('GenerateTopicHistoryTaskRunner')
    ));

    this.registerSingleton('SendTopicHistoryTaskRunner', () => new SendTopicHistoryTaskRunner(
      this.get('CustomerRepository'),
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('SendTopicHistoryByEmailPort'),
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('SendTopicHistoryTaskRunner')
    ));

    // Close-topic features
    this.registerSingleton('CheckAndCloseTopicsWithManyHistoriesFeature', () => new CheckAndCloseTopicsWithManyHistoriesFeature(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('CloseTopicFeature'),
      LoggerFactory.createLoggerForClass('CheckAndCloseTopicsWithManyHistoriesFeature')
    ));
    this.registerSingleton('RemoveTasksFromClosedTopicsFeature', () => new RemoveTasksFromClosedTopicsFeature(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('RemoveTasksFromClosedTopicsFeature')
    ));

    this.registerSingleton('CloseTopicsTaskRunner', () => new CloseTopicsTaskRunner(
      this.get('CheckAndCloseTopicsWithManyHistoriesFeature'),
      this.get('RemoveTasksFromClosedTopicsFeature'),
      LoggerFactory.createLoggerForClass('CloseTopicsTaskRunner'),
    ));

    this.registerSingleton('ProcessFailedTopicsTaskRunner', () => new ProcessFailedTopicsTaskRunner(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('ReGenerateTopicHistoryTaskRunner')
    ));

    this.registerSingleton('ReGenerateTopicHistoryTaskRunner', () => new ReGenerateTopicHistoryTaskRunner(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      this.get('CustomerRepository'),
      LoggerFactory.createLoggerForClass('GenerateTopicHistoryTaskRunner')
    ));

    // Register commands
    this.registerSingleton('CreateCustomerCommand', () => new CreateCustomerCommand(
      this.get('CreateCustomerFeature')
    ));

    this.registerSingleton('DeleteCustomerCommand', () => new DeleteCustomerCommand(
      this.get('DeleteCustomerFeature')
    ));

    this.registerSingleton('LoginCommand', () => new LoginCommand(
      this.get('LoginFeature')
    ));

    this.registerSingleton('VerifyCustomerCommand', () => new VerifyCustomerCommand(
      this.get('VerifyAuthCodeFeature')
    ));

    this.registerSingleton('AddTopicCommand', () => new AddTopicCommand(
      this.get('AddTopicFeature')
    ));

    this.registerSingleton('UpdateTopicCommand', () => new UpdateTopicCommand(
      this.get('UpdateTopicFeature')
    ));

    this.registerSingleton('CloseTopicCommand', () => new CloseTopicCommand(
      this.get('CloseTopicFeature')
    ));

    this.registerSingleton('DeleteTopicCommand', () => new DeleteTopicCommand(
      this.get('DeleteTopicFeature')
    ));

    this.registerSingleton('ProcessTopicHistoryWorkflowCommand', () => new ProcessTopicHistoryWorkflowCommand(
      this.get('ProcessTopicHistoryWorkflowFeature'),
      this.get('ProcessInfrastuctureWorkflow')
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

    this.registerSingleton('GetTopicHistoriesQuery', () => new GetTopicHistoriesQuery(
      this.get('GetTopicHistoriesFeature')
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