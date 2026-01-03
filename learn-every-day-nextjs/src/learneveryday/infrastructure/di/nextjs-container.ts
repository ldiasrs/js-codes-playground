import { DatabaseManager } from '../database/DatabaseManager';
import { AIPromptExecutorFactory } from '../adapters/ai/AIPromptExecutorFactory';
import { LoggerFactory } from '../adapters/loggers/LoggerFactory';
import { PromptBuilder } from '../../features/topic-histoy/domain/PromptBuilder';

// Repositories
import { SQLCustomerRepository } from '../adapters/repositories/SQLCustomerRepository';
import { SQLTopicRepository } from '../adapters/repositories/SQLTopicRepository';
import { SQLTopicHistoryRepository } from '../adapters/repositories/SQLTopicHistoryRepository';
import { SQLTaskProcessRepository } from '../adapters/repositories/SQLTaskProcessRepository';
import { SQLAuthenticationAttemptRepository } from '../adapters/repositories/SQLAuthenticationAttemptRepository';
import { SQLLogRepository } from '../adapters/repositories/SQLLogRepository';

// Ports
import { NodemailerTopicHistoryEmailSender } from '../adapters/email/NodemailerTopicHistoryEmailSender';
import { NodemailerVerificationCodeSender } from '../adapters/email/NodemailerVerificationCodeSender';
import { NodemailerTopicClosedEmailSender } from '../adapters/email/NodemailerTopicClosedEmailSender';

// Infrastructure Services
import { ProcessInfrastuctureWorkflow } from '../services/ProcessInfrastuctureWorkflow';
import { CleanOldLogsProcess } from '../adapters/loggers/CleanOldLogsProcess';
import { CreateCustomerFeature } from '@/learneveryday/features/auth/application/use-cases/CreateCustomerFeature';
import { DeleteCustomerFeature } from '@/learneveryday/features/auth/application/use-cases/DeleteCustomerFeature';
import { LoginFeature } from '@/learneveryday/features/auth/application/use-cases/LoginFeature';
import { VerifyAuthCodeFeature } from '@/learneveryday/features/auth/application/use-cases/VerifyAuthCodeFeature';
import { CloseTopicsTaskRunner } from '@/learneveryday/features/taskprocess/domain/close-topics/CloseTopicsTaskRunner';
import { GetTopicHistoriesFeature } from '@/learneveryday/features/topic-histoy/application/use-cases/GetTopicHistoriesFeature';
import { ExecuteTopicHistoryGenerationTaskRunner } from '@/learneveryday/features/taskprocess/domain/generate-topic-history/ExecuteTopicHistoryGenerationTaskRunner';
import { GenerateTopicHistoryFeature } from '@/learneveryday/features/topic-histoy/application/use-cases/GenerateTopicHistoryFeature';
import { CloseTopicTaskScheduler } from '@/learneveryday/features/taskprocess/domain/generate-topic-history/schedulers/CloseTopicTaskScheduler';
import { ProcessFailedTopicsTaskScheduler } from '@/learneveryday/features/taskprocess/domain/generate-topic-history/schedulers/ProcessFailedTopicsTaskScheduler';
import { ReGenerateTopicsTaskScheduler } from '@/learneveryday/features/taskprocess/domain/generate-topic-history/schedulers/ReGenerateTopicsTaskScheduler';
import { SendTopicHistoryTaskScheduler } from '@/learneveryday/features/taskprocess/domain/generate-topic-history/schedulers/SendTopicHistoryTaskScheduler';
import { ReProcessFailedTopicsTaskRunner } from '@/learneveryday/features/taskprocess/domain/process-failed-topics/ReProcessFailedTopicsTaskRunner';
import { ProcessWorkFlowFeature } from '@/learneveryday/features/taskprocess/application/use-cases/ProcessWorkFlowFeature';
import { AnalyzeTasksService } from '@/learneveryday/features/taskprocess/domain/schedule-topic-history-generation/AnalyzeTasksService';
import { CreateConfigService } from '@/learneveryday/features/taskprocess/domain/schedule-topic-history-generation/CreateConfigService';
import { CreateNewSimilarTopicsProcessor } from '@/learneveryday/features/topic-histoy/application/use-cases/CreateNewSimilarTopicsProcessor';
import { ScheduleGenerateTasksBatchProcessor } from '@/learneveryday/features/taskprocess/domain/schedule-topic-history-generation/ScheduleGenerateTasksBatchService';
import { SelectTopicsService } from '@/learneveryday/features/taskprocess/domain/schedule-topic-history-generation/SelectTopicsService';
import { ValidateCustomerService } from '@/learneveryday/features/taskprocess/domain/schedule-topic-history-generation/ValidateCustomerService';
import { ScheduleTopicHistoryGenerationTaskRunner } from '@/learneveryday/features/taskprocess/domain/schedule-topic-history-generation/ScheduleTopicHistoryGenerationTaskRunner';
import { SendTopicHistoryTaskRunner } from '@/learneveryday/features/taskprocess/domain/send-topic-history/SendTopicHistoryTaskRunner';
import { AddTopicFeature } from '@/learneveryday/features/topic/application/use-cases/AddTopicFeature';
import { CloseTopicFeature } from '@/learneveryday/features/topic/application/use-cases/CloseTopicFeature';
import { DeleteTopicFeature } from '@/learneveryday/features/topic/application/use-cases/DeleteTopicFeature';
import { GetAllTopicsFeature } from '@/learneveryday/features/topic/application/use-cases/GetAllTopicsFeature';
import { GetTopicByIdFeature } from '@/learneveryday/features/topic/application/use-cases/GetTopicByIdFeature';
import { SearchTopicsFeature } from '@/learneveryday/features/topic/application/use-cases/SearchTopicsFeature';
import { UpdateTopicFeature } from '@/learneveryday/features/topic/application/use-cases/UpdateTopicFeature';
import { TopicCreationPolicy } from '@/learneveryday/features/topic/domain/TopicCreationPolicy';
import { TopicUpdatePolicy } from '@/learneveryday/features/topic/domain/TopicUpdatePolicy';
import { TopicClosedNotificationService } from '@/learneveryday/features/topic/application/services/TopicClosedNotificationService';
import { TopicDeletionService } from '@/learneveryday/features/topic/application/services/TopicDeletionService';
import { CustomerValidationService } from '@/learneveryday/features/auth/application/services/CustomerValidationService';
import { CustomerCreationPolicy } from '@/learneveryday/features/auth/domain/CustomerCreationPolicy';
import { CustomerDeletionService } from '@/learneveryday/features/auth/application/services/CustomerDeletionService';
import { CustomerDeletionSaga } from '@/learneveryday/features/auth/application/sagas/CustomerDeletionSaga';
import { AuthenticationService } from '@/learneveryday/features/auth/application/services/AuthenticationService';
import { AuthenticationVerificationService } from '@/learneveryday/features/auth/application/services/AuthenticationVerificationService';
import { EmailValidationService } from '@/learneveryday/features/auth/application/services/EmailValidationService';
import { TokenGenerationService } from '@/learneveryday/features/auth/application/services/TokenGenerationService';
import { FilterReprocessableTasksService } from '@/learneveryday/features/taskprocess/domain/process-failed-topics/services/FilterReprocessableTasksService';
import { GetStuckTasksService } from '@/learneveryday/features/taskprocess/domain/process-failed-topics/services/GetStuckTasksService';
import { ReprocessStuckTasksService } from '@/learneveryday/features/taskprocess/domain/process-failed-topics/services/ReprocessStuckTasksService';
import { CheckAndCloseTopicsWithManyHistoriesService } from '@/learneveryday/features/taskprocess/domain/close-topics/service/CheckAndCloseTopicsWithManyHistoriesService';
import { RemoveTasksFromClosedTopicsService } from '@/learneveryday/features/taskprocess/domain/close-topics/service/RemoveTasksFromClosedTopicsService';
import { TasksProcessExecutor } from '@/learneveryday/features/taskprocess/domain/api/TasksProcessExecutor';
import { FindOrphanTasksService } from '@/learneveryday/features/taskprocess/domain/cleanup-orphan-tasks/service/FindOrphanTasksService';
import { DeleteOrphanTasksService } from '@/learneveryday/features/taskprocess/domain/cleanup-orphan-tasks/service/DeleteOrphanTasksService';
import { CleanupOrphanTasksRunner } from '@/learneveryday/features/taskprocess/domain/cleanup-orphan-tasks/CleanupOrphanTasksRunner';
import { FindTopicsWithoutTasksService } from '@/learneveryday/features/taskprocess/domain/schedule-missing-generation-tasks/service/FindTopicsWithoutTasksService';
import { ScheduleGenerationTasksService } from '@/learneveryday/features/taskprocess/domain/schedule-missing-generation-tasks/service/ScheduleGenerationTasksService';
import { ScheduleMissingGenerationTasksRunner } from '@/learneveryday/features/taskprocess/domain/schedule-missing-generation-tasks/ScheduleMissingGenerationTasksRunner';

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

    this.registerSingleton('CustomerDeletionSaga', () => new CustomerDeletionSaga(
      this.get('CustomerRepository'),
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('CustomerDeletionSaga')
    ));

    this.registerSingleton('AddTopicFeature', () => new AddTopicFeature(
      this.get('TopicRepository'),
      this.get('CustomerValidationService'),
      this.get('TopicCreationPolicy'),
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

    this.registerSingleton('GenerateAndSaveTopicHistoryFeature', () => new GenerateTopicHistoryFeature(
      this.get('TopicHistoryRepository'),
      this.get('AIPromptExecutorPort'),
      this.get('PromptBuilder'),
      LoggerFactory.createLoggerForClass('GenerateAndSaveTopicHistoryFeature')
    ));

    // Cleanup orphan tasks services
    this.registerSingleton('FindOrphanTasksService', () => new FindOrphanTasksService(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('FindOrphanTasksService')
    ));
    this.registerSingleton('DeleteOrphanTasksService', () => new DeleteOrphanTasksService(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('DeleteOrphanTasksService')
    ));
    this.registerSingleton('CleanupOrphanTasksRunner', () => new CleanupOrphanTasksRunner(
      this.get('FindOrphanTasksService'),
      this.get('DeleteOrphanTasksService'),
      LoggerFactory.createLoggerForClass('CleanupOrphanTasksRunner')
    ));

    // Schedule missing generation tasks services
    this.registerSingleton('FindTopicsWithoutTasksService', () => new FindTopicsWithoutTasksService(
      this.get('TopicRepository'),
      LoggerFactory.createLoggerForClass('FindTopicsWithoutTasksService')
    ));
    this.registerSingleton('ScheduleGenerationTasksService', () => new ScheduleGenerationTasksService(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('ScheduleGenerationTasksService')
    ));
    this.registerSingleton('ScheduleMissingGenerationTasksRunner', () => new ScheduleMissingGenerationTasksRunner(
      this.get('FindTopicsWithoutTasksService'),
      this.get('ScheduleGenerationTasksService'),
      LoggerFactory.createLoggerForClass('ScheduleMissingGenerationTasksRunner')
    ));

    this.registerSingleton('ProcessTopicHistoryWorkflowFeature', () => new ProcessWorkFlowFeature(
      this.get('TaskProcessRepository'),
      this.get('CleanupOrphanTasksRunner'),
      this.get('ScheduleMissingGenerationTasksRunner'),
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

    this.registerSingleton('ExecuteTopicHistoryGeneration', () => new ExecuteTopicHistoryGenerationTaskRunner(
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
    this.registerSingleton('CheckAndCloseTopicsWithManyHistoriesProcessor', () => new CheckAndCloseTopicsWithManyHistoriesService(
      this.get('TopicRepository'),
      this.get('TopicHistoryRepository'),
      this.get('CloseTopicFeature'),
      LoggerFactory.createLoggerForClass('CheckAndCloseTopicsWithManyHistoriesFeature')
    ));
    this.registerSingleton('RemoveTasksFromClosedTopicsProcessor', () => new RemoveTasksFromClosedTopicsService(
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
    this.registerSingleton('GetStuckTasksProcessor', () => new GetStuckTasksService(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('GetStuckTasksFeature')
    ));
    this.registerSingleton('FilterReprocessableTasksProcessor', () => new FilterReprocessableTasksService(
      LoggerFactory.createLoggerForClass('FilterReprocessableTasksFeature')
    ));
    this.registerSingleton('ReprocessStuckTasksProcessor', () => new ReprocessStuckTasksService(
      this.get('TaskProcessRepository'),
      LoggerFactory.createLoggerForClass('ReprocessStuckTasksFeature')
    ));

    this.registerSingleton('ProcessFailedTopicsTaskRunner', () => new ReProcessFailedTopicsTaskRunner(
      this.get('GetStuckTasksProcessor'),
      this.get('FilterReprocessableTasksProcessor'),
      this.get('ReprocessStuckTasksProcessor'),
      LoggerFactory.createLoggerForClass('ProcessFailedTopicsTaskRunner')
    ));

    // Re-generate-topic-history features
    this.registerSingleton('ValidateCustomerProcessor', () => new ValidateCustomerService(
      this.get('CustomerRepository'),
      LoggerFactory.createLoggerForClass('ValidateCustomerFeature')
    ));
    this.registerSingleton('CreateConfigProcessor', () => new CreateConfigService(
      LoggerFactory.createLoggerForClass('CreateConfigFeature'),
      50
    ));
    this.registerSingleton('AnalyzeTasksProcessor', () => new AnalyzeTasksService(
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
    this.registerSingleton('SelectTopicsProcessor', () => new SelectTopicsService(
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

    this.registerSingleton('ScheduleTopicHistoryGeneration', () => new ScheduleTopicHistoryGenerationTaskRunner(
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