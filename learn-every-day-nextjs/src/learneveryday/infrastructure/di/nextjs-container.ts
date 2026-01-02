import { DatabaseManager } from '../database/DatabaseManager';
import { AIPromptExecutorFactory } from '../factories/AIPromptExecutorFactory';
import { LoggerFactory } from '../factories/LoggerFactory';
import { PromptBuilder } from '../../features/topic-histoy/domain/PromptBuilder';

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

// Infrastructure Services
import { ProcessInfrastuctureWorkflow } from '../services/ProcessInfrastuctureWorkflow';
import { CleanOldLogsProcess } from '../adapters/loggers/CleanOldLogsProcess';
import { CreateCustomerFeature } from '@/learneveryday/features/auth/application/use-cases/CreateCustomerFeature';
import { DeleteCustomerFeature } from '@/learneveryday/features/auth/application/use-cases/DeleteCustomerFeature';
import { LoginFeature } from '@/learneveryday/features/auth/application/use-cases/LoginFeature';
import { VerifyAuthCodeFeature } from '@/learneveryday/features/auth/application/use-cases/VerifyAuthCodeFeature';
import { TasksProcessExecutor } from '@/learneveryday/features/taskprocess/application/use-cases/TasksProcessExecutor';
import { CloseTopicsTaskRunner } from '@/learneveryday/features/taskprocess/application/use-cases/CloseTopicsTaskRunner';
import { GetTopicHistoriesFeature } from '@/learneveryday/features/topic-histoy/application/use-cases/close-topic/GetTopicHistoriesFeature';
import { CheckAndCloseTopicsWithManyHistoriesProcessor } from '@/learneveryday/features/topic-histoy/application/use-cases/close-topic/processor/CheckAndCloseTopicsWithManyHistoriesProcessor';
import { RemoveTasksFromClosedTopicsProcessor } from '@/learneveryday/features/topic-histoy/application/use-cases/close-topic/processor/RemoveTasksFromClosedTopicsProcessor';
import { ExecuteTopicHistoryGeneration } from '@/learneveryday/features/topic-histoy/application/use-cases/generate-topic-history/ExecuteTopicHistoryGeneration';
import { GenerateAndSaveTopicHistoryFeature } from '@/learneveryday/features/topic-histoy/application/use-cases/generate-topic-history/GenerateAndSaveTopicHistory';
import { CloseTopicTaskScheduler } from '@/learneveryday/features/topic-histoy/application/use-cases/generate-topic-history/schedulers/CloseTopicTaskScheduler';
import { ProcessFailedTopicsTaskScheduler } from '@/learneveryday/features/topic-histoy/application/use-cases/generate-topic-history/schedulers/ProcessFailedTopicsTaskScheduler';
import { ReGenerateTopicsTaskScheduler } from '@/learneveryday/features/topic-histoy/application/use-cases/generate-topic-history/schedulers/ReGenerateTopicsTaskScheduler';
import { SendTopicHistoryTaskScheduler } from '@/learneveryday/features/topic-histoy/application/use-cases/generate-topic-history/schedulers/SendTopicHistoryTaskScheduler';
import { ProcessFailedTopicsTaskRunner } from '@/learneveryday/features/topic-histoy/application/use-cases/process-failed-topics/ProcessFailedTopicsTaskRunner';
import { FilterReprocessableTasksProcessor } from '@/learneveryday/features/topic-histoy/application/use-cases/process-failed-topics/processor/FilterReprocessableTasksProcessor';
import { GetStuckTasksProcessor } from '@/learneveryday/features/topic-histoy/application/use-cases/process-failed-topics/processor/GetStuckTasksProcessor';
import { ReprocessStuckTasksProcessor } from '@/learneveryday/features/topic-histoy/application/use-cases/process-failed-topics/processor/ReprocessStuckTasksProcessor';
import { ProcessTopicHistoryWorkflowFeature } from '@/learneveryday/features/topic-histoy/application/use-cases/ProcessTopicHistoryWorkflowFeature';
import { AnalyzeTasksProcessor } from '@/learneveryday/features/taskprocess/application/use-cases/schedule-topic-history-generation/processor/AnalyzeTasksProcessor';
import { CreateConfigProcessor } from '@/learneveryday/features/taskprocess/application/use-cases/schedule-topic-history-generation/processor/CreateConfigProcessor';
import { CreateNewSimilarTopicsProcessor } from '@/learneveryday/features/topic-histoy/application/use-cases/CreateNewSimilarTopicsProcessor';
import { ScheduleGenerateTasksBatchProcessor } from '@/learneveryday/features/taskprocess/application/use-cases/schedule-topic-history-generation/processor/ScheduleGenerateTasksBatchProcessor';
import { SelectTopicsProcessor } from '@/learneveryday/features/taskprocess/application/use-cases/schedule-topic-history-generation/processor/SelectTopicsProcessor';
import { ValidateCustomerProcessor } from '@/learneveryday/features/taskprocess/application/use-cases/schedule-topic-history-generation/processor/ValidateCustomerProcessor';
import { ScheduleTopicHistoryGeneration } from '@/learneveryday/features/taskprocess/application/use-cases/schedule-topic-history-generation/ScheduleTopicHistoryGeneration';
import { SendTopicHistoryTaskRunner } from '@/learneveryday/features/topic-histoy/application/use-cases/SendTopicHistoryTaskRunner';
import { AddTopicFeature } from '@/learneveryday/features/topic/application/use-cases/AddTopicFeature';
import { CloseTopicFeature } from '@/learneveryday/features/topic/application/use-cases/CloseTopicFeature';
import { DeleteTopicFeature } from '@/learneveryday/features/topic/application/use-cases/DeleteTopicFeature';
import { GetAllTopicsFeature } from '@/learneveryday/features/topic/application/use-cases/GetAllTopicsFeature';
import { GetTopicByIdFeature } from '@/learneveryday/features/topic/application/use-cases/GetTopicByIdFeature';
import { SearchTopicsFeature } from '@/learneveryday/features/topic/application/use-cases/SearchTopicsFeature';
import { UpdateTopicFeature } from '@/learneveryday/features/topic/application/use-cases/UpdateTopicFeature';
import { TopicCreationPolicy } from '@/learneveryday/features/topic/domain/services/TopicCreationPolicy';
import { TopicUpdatePolicy } from '@/learneveryday/features/topic/domain/services/TopicUpdatePolicy';
import { TopicCreationSaga } from '@/learneveryday/features/topic/application/sagas/TopicCreationSaga';
import { TopicDeletionSaga } from '@/learneveryday/features/topic/application/sagas/TopicDeletionSaga';
import { TopicClosedNotificationService } from '@/learneveryday/features/topic/application/services/TopicClosedNotificationService';
import { TopicDeletionService } from '@/learneveryday/features/topic/application/services/TopicDeletionService';
import { CustomerValidationService } from '@/learneveryday/features/auth/application/services/CustomerValidationService';
import { CustomerCreationPolicy } from '@/learneveryday/features/auth/domain/services/CustomerCreationPolicy';
import { CustomerDeletionService } from '@/learneveryday/features/auth/application/services/CustomerDeletionService';
import { CustomerDeletionSaga } from '@/learneveryday/features/auth/application/sagas/CustomerDeletionSaga';
import { AuthenticationService } from '@/learneveryday/features/auth/application/services/AuthenticationService';
import { AuthenticationVerificationService } from '@/learneveryday/features/auth/application/services/AuthenticationVerificationService';
import { EmailValidationService } from '@/learneveryday/features/auth/application/services/EmailValidationService';
import { TokenGenerationService } from '@/learneveryday/features/auth/application/services/TokenGenerationService';
import { TopicHistoryTaskSchedulerService } from '@/learneveryday/features/taskprocess/application/services/TopicHistoryTaskScheduler';

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
      this.get('CustomerCreationPolicy'),
      LoggerFactory.createLoggerForClass('CreateCustomerFeature')
    ));

    this.registerSingleton('DeleteCustomerFeature', () => new DeleteCustomerFeature(
      this.get('CustomerRepository'),
      this.get('CustomerDeletionService'),
      this.get('CustomerDeletionSaga')
    ));

    this.registerSingleton('LoginFeature', () => new LoginFeature(
      this.get('AuthenticationService')
    ));

    this.registerSingleton('VerifyAuthCodeFeature', () => new VerifyAuthCodeFeature(
      this.get('AuthenticationVerificationService')
    ));

    // Register domain services (pure business logic, no infrastructure)
    this.registerSingleton('TopicCreationPolicy', () => new TopicCreationPolicy(
      this.get('TopicRepository')
    ));
    this.registerSingleton('TopicUpdatePolicy', () => new TopicUpdatePolicy(
      this.get('TopicRepository')
    ));
    this.registerSingleton('CustomerCreationPolicy', () => new CustomerCreationPolicy(
      this.get('CustomerRepository')
    ));

    // Register application services (orchestration with infrastructure)
    this.registerSingleton('CustomerValidationService', () => new CustomerValidationService(
      this.get('CustomerRepository')
    ));
    this.registerSingleton('EmailValidationService', () => new EmailValidationService());
    this.registerSingleton('TokenGenerationService', () => new TokenGenerationService());
    this.registerSingleton('TopicClosedNotificationService', () => new TopicClosedNotificationService(
      this.get('CustomerRepository'),
      this.get('SendTopicClosedEmailPort'),
      LoggerFactory.createLoggerForClass('TopicClosedNotificationService')
    ));
    this.registerSingleton('TopicDeletionService', () => new TopicDeletionService(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('TopicDeletionService')
    ));
    this.registerSingleton('CustomerDeletionService', () => new CustomerDeletionService(
      this.get('CustomerRepository'),
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('CustomerDeletionService')
    ));
    this.registerSingleton('AuthenticationService', () => new AuthenticationService(
      this.get('CustomerRepository'),
      this.get('VerificationCodeSender'),
      this.get('AuthenticationAttemptRepository'),
      this.get('EmailValidationService'),
      LoggerFactory.createLoggerForClass('AuthenticationService')
    ));
    this.registerSingleton('AuthenticationVerificationService', () => new AuthenticationVerificationService(
      this.get('CustomerRepository'),
      this.get('AuthenticationAttemptRepository'),
      this.get('TokenGenerationService'),
      LoggerFactory.createLoggerForClass('AuthenticationVerificationService')
    ));
    this.registerSingleton('TopicHistoryTaskScheduler', () => new TopicHistoryTaskSchedulerService(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('TopicHistoryTaskScheduler')
    ));

    // Register sagas
    this.registerSingleton('TopicCreationSaga', () => new TopicCreationSaga(
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('TopicCreationSaga')
    ));
    this.registerSingleton('TopicDeletionSaga', () => new TopicDeletionSaga(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('TopicDeletionSaga')
    ));
    this.registerSingleton('CustomerDeletionSaga', () => new CustomerDeletionSaga(
      this.get('CustomerRepository'),
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('CustomerDeletionSaga')
    ));

    this.registerSingleton('AddTopicFeature', () => new AddTopicFeature(
      this.get('TopicRepository'),
      this.get('CustomerValidationService'),
      this.get('TopicCreationPolicy'),
      this.get('TopicHistoryTaskScheduler'),
      this.get('TopicCreationSaga'),
      LoggerFactory.createLoggerForClass('AddTopicFeature')
    ));

    this.registerSingleton('UpdateTopicFeature', () => new UpdateTopicFeature(
      this.get('TopicRepository'),
      this.get('TopicUpdatePolicy'),
      LoggerFactory.createLoggerForClass('UpdateTopicFeature')
    ));

    this.registerSingleton('CloseTopicFeature', () => new CloseTopicFeature(
      this.get('TopicRepository'),
      this.get('TopicClosedNotificationService'),
      LoggerFactory.createLoggerForClass('CloseTopicFeature')
    ));

    this.registerSingleton('DeleteTopicFeature', () => new DeleteTopicFeature(
      this.get('TopicRepository'),
      this.get('TopicDeletionService'),
      this.get('TopicDeletionSaga'),
      LoggerFactory.createLoggerForClass('DeleteTopicFeature')
    ));

    this.registerSingleton('GetAllTopicsFeature', () => new GetAllTopicsFeature(
      this.get('TopicRepository'),
      this.get('CustomerValidationService'),
      LoggerFactory.createLoggerForClass('GetAllTopicsFeature')
    ));

    this.registerSingleton('GetTopicByIdFeature', () => new GetTopicByIdFeature(
      this.get('TopicRepository'),
      this.get('CustomerValidationService'),
      LoggerFactory.createLoggerForClass('GetTopicByIdFeature')
    ));

    this.registerSingleton('SearchTopicsFeature', () => new SearchTopicsFeature(
      this.get('TopicRepository'),
      this.get('CustomerValidationService'),
      LoggerFactory.createLoggerForClass('SearchTopicsFeature')
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
      this.get('ScheduleTopicHistoryGeneration'),
      this.get('ExecuteTopicHistoryGeneration'),
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

    this.registerSingleton('ExecuteTopicHistoryGeneration', () => new ExecuteTopicHistoryGeneration(
      this.get('TopicRepository'),
      this.get('GenerateAndSaveTopicHistoryFeature'),
      this.get('SendTopicHistoryTaskScheduler'),
      this.get('ReGenerateTopicsTaskScheduler'),
      this.get('CloseTopicTaskScheduler'),
      this.get('ProcessFailedTopicsTaskScheduler'),
      LoggerFactory.createLoggerForClass('ExecuteTopicHistoryGeneration')
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
    this.registerSingleton('CheckAndCloseTopicsWithManyHistoriesProcessor', () => new CheckAndCloseTopicsWithManyHistoriesProcessor(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('CloseTopicFeature'),
      LoggerFactory.createLoggerForClass('CheckAndCloseTopicsWithManyHistoriesFeature')
    ));
    this.registerSingleton('RemoveTasksFromClosedTopicsProcessor', () => new RemoveTasksFromClosedTopicsProcessor(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('RemoveTasksFromClosedTopicsFeature')
    ));

    this.registerSingleton('CloseTopicsTaskRunner', () => new CloseTopicsTaskRunner(
      this.get('CheckAndCloseTopicsWithManyHistoriesProcessor'),
      this.get('RemoveTasksFromClosedTopicsProcessor'),
      LoggerFactory.createLoggerForClass('CloseTopicsTaskRunner'),
    ));

    // Process-failed-topics features
    this.registerSingleton('GetStuckTasksProcessor', () => new GetStuckTasksProcessor(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('GetStuckTasksFeature')
    ));
    this.registerSingleton('FilterReprocessableTasksProcessor', () => new FilterReprocessableTasksProcessor(
      LoggerFactory.createLoggerForClass('FilterReprocessableTasksFeature')
    ));
    this.registerSingleton('ReprocessStuckTasksProcessor', () => new ReprocessStuckTasksProcessor(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('ReprocessStuckTasksFeature')
    ));

    this.registerSingleton('ProcessFailedTopicsTaskRunner', () => new ProcessFailedTopicsTaskRunner(
      this.get('GetStuckTasksProcessor'),
      this.get('FilterReprocessableTasksProcessor'),
      this.get('ReprocessStuckTasksProcessor'),
      LoggerFactory.createLoggerForClass('ProcessFailedTopicsTaskRunner')
    ));

    // Re-generate-topic-history features
    this.registerSingleton('ValidateCustomerProcessor', () => new ValidateCustomerProcessor(
      this.get('CustomerRepository'),
      LoggerFactory.createLoggerForClass('ValidateCustomerFeature')
    ));
    this.registerSingleton('CreateConfigProcessor', () => new CreateConfigProcessor(
      LoggerFactory.createLoggerForClass('CreateConfigFeature'),
      50
    ));
    this.registerSingleton('AnalyzeTasksProcessor', () => new AnalyzeTasksProcessor(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('AnalyzeTasksFeature')
    ));
    this.registerSingleton('CreateNewSimilarTopicsProcessor', () => new CreateNewSimilarTopicsProcessor(
      this.get('AIPromptExecutorPort'),
      this.get('TopicRepository'),
      this.get('CustomerRepository'),
      this.get('AddTopicFeature'),
      this.get('DeleteTopicFeature'),
      LoggerFactory.createLoggerForClass('CreateNewSimilarTopicsProcessor')
    ));
    this.registerSingleton('SelectTopicsProcessor', () => new SelectTopicsProcessor(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      LoggerFactory.createLoggerForClass('SelectTopicsForProcessingFeature'),
      5,
      5,
      this.get('CreateNewSimilarTopicsProcessor')
    ));
    this.registerSingleton('ScheduleGenerateTasksBatchProcessor', () => new ScheduleGenerateTasksBatchProcessor(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('ScheduleGenerateTasksBatchFeature')
    ));

    this.registerSingleton('ScheduleTopicHistoryGeneration', () => new ScheduleTopicHistoryGeneration(
      this.get('ValidateCustomerProcessor'),
      this.get('CreateConfigProcessor'),
      this.get('AnalyzeTasksProcessor'),
      this.get('SelectTopicsProcessor'),
      this.get('ScheduleGenerateTasksBatchProcessor'),
      LoggerFactory.createLoggerForClass('ScheduleTopicHistoryGeneration')
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