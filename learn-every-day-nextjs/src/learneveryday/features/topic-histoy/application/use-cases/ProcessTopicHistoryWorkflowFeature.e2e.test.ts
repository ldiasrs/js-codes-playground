import { ProcessTopicHistoryWorkflowFeature } from './ProcessTopicHistoryWorkflowFeature';
import { TaskProcess } from '../../../taskprocess/domain/TaskProcess';
import { TaskProcessRepositoryPort } from '../../../taskprocess/application/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../../../shared/ports/LoggerPort';
import { ProcessFailedTopicsTaskRunner } from './process-failed-topics/ProcessFailedTopicsTaskRunner';
import { GetStuckTasksProcessor } from './process-failed-topics/processor/GetStuckTasksProcessor';
import { FilterReprocessableTasksProcessor } from './process-failed-topics/processor/FilterReprocessableTasksProcessor';
import { ReprocessStuckTasksProcessor } from './process-failed-topics/processor/ReprocessStuckTasksProcessor';
import { CloseTopicsTaskRunner } from './close-topic/CloseTopicsTaskRunner';
import { CheckAndCloseTopicsWithManyHistoriesProcessor } from './close-topic/processor/CheckAndCloseTopicsWithManyHistoriesProcessor';
import { RemoveTasksFromClosedTopicsProcessor } from './close-topic/processor/RemoveTasksFromClosedTopicsProcessor';
import { CloseTopicFeature } from '../../../topic/application/use-cases/CloseTopicFeature';
import { ScheduleTopicHistoryGeneration } from './schedule-topic-history-generation/ScheduleTopicHistoryGeneration';
import { ValidateCustomerProcessor } from './schedule-topic-history-generation/processor/ValidateCustomerProcessor';
import { CreateConfigProcessor } from './schedule-topic-history-generation/processor/CreateConfigProcessor';
import { AnalyzeTasksProcessor } from './schedule-topic-history-generation/processor/AnalyzeTasksProcessor';
import { SelectTopicsProcessor } from './schedule-topic-history-generation/processor/SelectTopicsProcessor';
import { ScheduleGenerateTasksBatchProcessor } from './schedule-topic-history-generation/processor/ScheduleGenerateTasksBatchProcessor';
import { ExecuteTopicHistoryGeneration } from './generate-topic-history/ExecuteTopicHistoryGeneration';
import { GenerateAndSaveTopicHistoryFeature } from './generate-topic-history/GenerateAndSaveTopicHistory';
import { PromptBuilder } from '../../domain/PromptBuilder';
import { SendTopicHistoryTaskScheduler } from './generate-topic-history/schedulers/SendTopicHistoryTaskScheduler';
import { ReGenerateTopicsTaskScheduler } from './generate-topic-history/schedulers/ReGenerateTopicsTaskScheduler';
import { CloseTopicTaskScheduler } from './generate-topic-history/schedulers/CloseTopicTaskScheduler';
import { ProcessFailedTopicsTaskScheduler } from './generate-topic-history/schedulers/ProcessFailedTopicsTaskScheduler';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';
import { CreateNewSimilarTopicsProcessor } from './schedule-topic-history-generation/processor/CreateNewSimilarTopicsProcessor';
import { AddTopicFeature } from '../../../topic/application/use-cases/AddTopicFeature';
import { DeleteTopicFeature } from '../../../topic/application/use-cases/DeleteTopicFeature';

// Domain ports
import { TopicRepositoryPort } from '../../../topic/application/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../ports/TopicHistoryRepositoryPort';
import { CustomerRepositoryPort } from '../../../auth/application/ports/CustomerRepositoryPort';
import { Customer, CustomerTier } from '../../../auth/domain/Customer';
import { SendTopicClosedEmailPort } from '../../../topic/application/ports/SendTopicClosedEmailPort';
import { Topic } from '../../../topic/domain/Topic';
import { TopicHistory } from '../../domain/TopicHistory';
import { AIPromptExecutorPort } from '../../ports/AIPromptExecutorPort';
import { SendTopicHistoryByEmailPort } from '../../ports/SendTopicHistoryByEmailPort';

describe('ProcessTopicHistoryWorkflowFeature (e2e)', () => {
  let logger: jest.Mocked<LoggerPort>;

  // Ports (mocks)
  let taskProcessRepository: jest.Mocked<TaskProcessRepositoryPort>;
  let topicRepository: jest.Mocked<TopicRepositoryPort>;
  let topicHistoryRepository: jest.Mocked<TopicHistoryRepositoryPort>;
  let customerRepository: jest.Mocked<CustomerRepositoryPort>;
  let sendTopicClosedEmailPort: jest.Mocked<SendTopicClosedEmailPort>;
  let aiPromptExecutorPort: jest.Mocked<AIPromptExecutorPort>;
  let sendTopicHistoryByEmailPort: jest.Mocked<SendTopicHistoryByEmailPort>;

  // In-memory stores to emulate repository behaviors across the whole workflow
  let tasksStore: TaskProcess[];
  const historiesStore = new Map<string, TopicHistory[]>(); // key: topicId
  let topicsById: Map<string, Topic>;
  let customer: Customer;

  const customerId = 'cust-e2e-1';
  const topicId = 'topic-e2e-1';
  const secondTopicId = 'topic-e2e-2';
  const DEFAULT_LIMIT = 10;
  const DEFAULT_MAX_EXECUTION_TIME_MS = 10000;

  beforeEach(() => {
    // Logger
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      child: jest.fn().mockReturnValue({} as unknown as LoggerPort),
    } as unknown as jest.Mocked<LoggerPort>;

    // Customer
    customer = Customer.createWithCPF('John Tester', '01234567890', 'john@test.com', '999-999', customerId, CustomerTier.Standard);

    // Topics and in-memory state
    topicsById = new Map<string, Topic>();
    topicsById.set(topicId, new Topic(customerId, 'E2E Subject', topicId, undefined, false));
    topicsById.set(secondTopicId, new Topic(customerId, 'Another Subject', secondTopicId, undefined, false));
    historiesStore.clear();
    historiesStore.set(topicId, []);
    historiesStore.set(secondTopicId, [
      new TopicHistory(secondTopicId, 'h1'),
      new TopicHistory(secondTopicId, 'h2'),
      new TopicHistory(secondTopicId, 'h3'),
      new TopicHistory(secondTopicId, 'h4'), // at threshold for closing
    ]);

    // Seed tasks
    tasksStore = [
      new TaskProcess('ignored', customerId, TaskProcess.PROCESS_FAILED_TOPICS, 'pending'),
      new TaskProcess('ignored', customerId, TaskProcess.CLOSE_TOPIC, 'pending'),
      new TaskProcess('ignored', customerId, TaskProcess.REGENERATE_TOPICS_HISTORIES, 'pending'),
      new TaskProcess(topicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'pending'),
      new TaskProcess(secondTopicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'pending'),
      // SEND_TOPIC_HISTORY will be scheduled later by the pipeline
    ];

    // Task repository mock with in-memory behavior
    taskProcessRepository = {
      save: jest.fn().mockImplementation(async (tp: TaskProcess) => {
        const idx = tasksStore.findIndex(t => t.id === tp.id);
        if (idx >= 0) {
          tasksStore[idx] = tp;
        } else {
          tasksStore.push(tp);
        }
        return tp;
      }),
      findById: jest.fn().mockImplementation(async (id: string) => tasksStore.find(t => t.id === id)),
      findAll: jest.fn().mockResolvedValue([]),
      findByEntityId: jest.fn().mockImplementation(async (entityId: string) => tasksStore.filter(t => t.entityId === entityId)),
      findByCustomerId: jest.fn().mockImplementation(async (custId: string) => tasksStore.filter(t => t.customerId === custId)),
      findByType: jest.fn().mockImplementation(async (type: string) => tasksStore.filter(t => t.type === type)),
      findByStatus: jest.fn().mockImplementation(async (status: string) => tasksStore.filter(t => t.status === status)),
      findByEntityIdAndType: jest.fn().mockImplementation(async (entityId: string, type: string) => tasksStore.filter(t => t.entityId === entityId && t.type === type)),
      findPendingTasks: jest.fn().mockResolvedValue([]),
      findRunningTasks: jest.fn().mockResolvedValue([]),
      findScheduledTasks: jest.fn().mockResolvedValue([]),
      findFailedTasks: jest.fn().mockResolvedValue([]),
      findPendingTaskProcessByStatusAndType: jest.fn().mockImplementation(async (status, type, limit = 10) => {
        return tasksStore.filter(t => t.status === status && t.type === type).slice(0, limit);
      }),
      searchProcessedTasks: jest.fn().mockImplementation(async (criteria) => {
        // simple filter by available fields
        return tasksStore.filter(t => {
          if (criteria.entityId && t.entityId !== criteria.entityId) return false;
          if (criteria.customerId && t.customerId !== criteria.customerId) return false;
          if (criteria.type && t.type !== criteria.type) return false;
          if (criteria.status && t.status !== criteria.status) return false;
          if (criteria.dateFrom && t.createdAt < criteria.dateFrom) return false;
          if (criteria.dateTo && t.createdAt > criteria.dateTo) return false;
          return true;
        });
      }),
      delete: jest.fn().mockResolvedValue(true),
      deleteByEntityId: jest.fn().mockResolvedValue(undefined),
      deleteByCustomerId: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
      countByStatus: jest.fn().mockResolvedValue(0),
      countByType: jest.fn().mockResolvedValue(0),
      getTasksCreatedToday: jest.fn().mockResolvedValue([]),
      getTasksCreatedThisWeek: jest.fn().mockResolvedValue([]),
      getTasksCreatedThisMonth: jest.fn().mockResolvedValue([]),
      getTasksScheduledForDate: jest.fn().mockResolvedValue([]),
      getTasksScheduledForDateRange: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<TaskProcessRepositoryPort>;

    // Topic repository
    topicRepository = {
      findByCustomerId: jest.fn().mockImplementation(async (custId: string) => {
        return Array.from(topicsById.values()).filter(t => t.customerId === custId);
      }),
      findById: jest.fn().mockImplementation(async (id: string) => topicsById.get(id)),
      save: jest.fn().mockImplementation(async (t: Topic) => {
        topicsById.set(t.id, t);
        return t;
      }),
      findAll: jest.fn(),
      findBySubject: jest.fn(),
      findByDateRange: jest.fn(),
      findWithRecentActivity: jest.fn(),
      findTopicsWithOldestHistories: jest.fn(),
      existsByCustomerIdAndSubject: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      getTopicsCreatedToday: jest.fn(),
      getTopicsCreatedThisWeek: jest.fn(),
      getTopicsCreatedThisMonth: jest.fn(),
      countByCustomerId: jest.fn(),
    } as unknown as jest.Mocked<TopicRepositoryPort>;

    // Topic history repository
    topicHistoryRepository = {
      findByTopicId: jest.fn().mockImplementation(async (id: string) => historiesStore.get(id) || []),
      findById: jest.fn().mockImplementation(async (id: string) => {
        const all = Array.from(historiesStore.values()).flat();
        return all.find(h => h.id === id);
      }),
      save: jest.fn().mockImplementation(async (h: TopicHistory) => {
        const arr = historiesStore.get(h.topicId) || [];
        arr.push(h);
        historiesStore.set(h.topicId, arr);
        return h;
      }),
      findAll: jest.fn(),
      findByContent: jest.fn(),
      findByDateRange: jest.fn(),
      findWithRecentActivity: jest.fn(),
      search: jest.fn(),
      findLastTopicHistoryByCustomerId: jest.fn(),
      delete: jest.fn(),
      deleteByTopicId: jest.fn(),
      count: jest.fn(),
      getTopicHistoryCreatedToday: jest.fn(),
      getTopicHistoryCreatedThisWeek: jest.fn(),
      getTopicHistoryCreatedThisMonth: jest.fn(),
    } as unknown as jest.Mocked<TopicHistoryRepositoryPort>;

    // Customer repository
    customerRepository = {
      findById: jest.fn().mockResolvedValue(customer),
      save: jest.fn(),
      findAll: jest.fn(),
      findByCustomerName: jest.fn(),
      findByEmail: jest.fn(),
      findByGovIdentification: jest.fn(),
      findByTier: jest.fn(),
      findByDateRange: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      getCustomersCreatedToday: jest.fn(),
      getCustomersCreatedThisWeek: jest.fn(),
      getCustomersCreatedThisMonth: jest.fn(),
      getCustomersWithRecentActivity: jest.fn(),
    } as unknown as jest.Mocked<CustomerRepositoryPort>;

    sendTopicClosedEmailPort = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SendTopicClosedEmailPort>;

    aiPromptExecutorPort = {
      execute: jest.fn().mockImplementation(async (prompt: string) => {
        // First call (main topics) returns 9 numbered lines; second call returns content
        if (prompt.includes('principais conteúdos')) {
          return [1,2,3,4,5,6,7,8,9].map(i => `${i}. Topic ${i}`).join('\n');
        }
        return '1. Generated content A\n2. Generated content B\n3. Generated content C';
      }),
    } as unknown as jest.Mocked<AIPromptExecutorPort>;

    sendTopicHistoryByEmailPort = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SendTopicHistoryByEmailPort>;
  });

  function buildWorkflow(): ProcessTopicHistoryWorkflowFeature {
    const getStuck = new GetStuckTasksProcessor(taskProcessRepository, logger);
    const filterReprocess = new FilterReprocessableTasksProcessor(logger);
    const reprocess = new ReprocessStuckTasksProcessor(taskProcessRepository, logger);
    const processFailedRunner = new ProcessFailedTopicsTaskRunner(getStuck, filterReprocess, reprocess, logger);

    const closeTopicFeature = new CloseTopicFeature(topicRepository, logger, customerRepository, sendTopicClosedEmailPort);
    const checkAndClose = new CheckAndCloseTopicsWithManyHistoriesProcessor(topicRepository, topicHistoryRepository, closeTopicFeature, logger);
    const removeTasksFromClosed = new RemoveTasksFromClosedTopicsProcessor(topicRepository, topicHistoryRepository, taskProcessRepository, logger);
    const closeTopicsRunner = new CloseTopicsTaskRunner(checkAndClose, removeTasksFromClosed, logger);

    const validateCustomer = new ValidateCustomerProcessor(customerRepository, logger);
    const createConfig = new CreateConfigProcessor(logger, 50);
    const analyzeTasks = new AnalyzeTasksProcessor(taskProcessRepository, logger);
    const addTopicFeature = new AddTopicFeature(topicRepository, customerRepository, taskProcessRepository, logger);
    const deleteTopicFeature = new DeleteTopicFeature(topicRepository, topicHistoryRepository, taskProcessRepository, logger);
    const createNewSimilarTopics = new CreateNewSimilarTopicsProcessor(aiPromptExecutorPort, topicRepository, customerRepository, addTopicFeature, deleteTopicFeature, logger);
    const selectTopics = new SelectTopicsProcessor(topicRepository, topicHistoryRepository, logger, 5, 5, createNewSimilarTopics);
    const scheduleBatch = new ScheduleGenerateTasksBatchProcessor(taskProcessRepository, logger);
    const reGenerateRunner = new ScheduleTopicHistoryGeneration(
      validateCustomer,
      createConfig,
      analyzeTasks,
      selectTopics,
      scheduleBatch,
      logger
    );

    const promptBuilder = new PromptBuilder(logger);
    const generateAndSave = new GenerateAndSaveTopicHistoryFeature(topicHistoryRepository, aiPromptExecutorPort, promptBuilder, logger);
    const sendScheduler = new SendTopicHistoryTaskScheduler(taskProcessRepository, logger);
    const regenerateScheduler = new ReGenerateTopicsTaskScheduler(taskProcessRepository, logger);
    const closeScheduler = new CloseTopicTaskScheduler(taskProcessRepository, logger);
    const failedScheduler = new ProcessFailedTopicsTaskScheduler(taskProcessRepository, logger);
    const generateRunner = new ExecuteTopicHistoryGeneration(
      topicRepository,
      generateAndSave,
      sendScheduler,
      regenerateScheduler,
      closeScheduler,
      failedScheduler,
      logger
    );

    const sendRunner = new SendTopicHistoryTaskRunner(
      customerRepository,
      topicRepository,
      topicHistoryRepository,
      sendTopicHistoryByEmailPort,
      taskProcessRepository,
      logger
    );

    return new ProcessTopicHistoryWorkflowFeature(
      taskProcessRepository,
      processFailedRunner,
      closeTopicsRunner,
      reGenerateRunner,
      generateRunner,
      sendRunner,
      logger
    );
  }

  it('reprocesses stuck tasks in process-failed-topics step', async () => {
    const workflow = buildWorkflow();
    const failedTask = new TaskProcess(topicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'failed', undefined, 'The model is overloaded. Please try again later.');
    const runningTask = new TaskProcess(topicId, customerId, TaskProcess.SEND_TOPIC_HISTORY, 'running');
    tasksStore.push(failedTask, runningTask);
    await workflow.execute({ limit: DEFAULT_LIMIT, maxExecutionTimeMs: DEFAULT_MAX_EXECUTION_TIME_MS });
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: failedTask.id, status: 'pending' }));
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: runningTask.id, status: 'pending' }));
  });

  it('closes eligible topics and cancels related tasks', async () => {
    const workflow = buildWorkflow();
    const failedTask = new TaskProcess(topicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'failed', undefined, 'The model is overloaded. Please try again later.');
    const runningTask = new TaskProcess(topicId, customerId, TaskProcess.SEND_TOPIC_HISTORY, 'running');
    tasksStore.push(failedTask, runningTask);
    await workflow.execute({ limit: DEFAULT_LIMIT, maxExecutionTimeMs: DEFAULT_MAX_EXECUTION_TIME_MS });
    expect(topicRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: secondTopicId, closed: true }));
    expect(sendTopicClosedEmailPort.send).toHaveBeenCalled();
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
  });

  it('schedules new generate tasks during re-generate step (tier limits respected)', async () => {
    const workflow = buildWorkflow();
    const failedTask = new TaskProcess(topicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'failed', undefined, 'The model is overloaded. Please try again later.');
    const runningTask = new TaskProcess(topicId, customerId, TaskProcess.SEND_TOPIC_HISTORY, 'running');
    tasksStore.push(failedTask, runningTask);
    await workflow.execute({ limit: DEFAULT_LIMIT, maxExecutionTimeMs: DEFAULT_MAX_EXECUTION_TIME_MS });
    expect(taskProcessRepository.searchProcessedTasks).toHaveBeenCalledWith(expect.objectContaining({ customerId }));
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: TaskProcess.GENERATE_TOPIC_HISTORY, status: 'pending' }));
  });

  it('generates a topic history and schedules subsequent tasks', async () => {
    const workflow = buildWorkflow();
    const failedTask = new TaskProcess(topicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'failed', undefined, 'The model is overloaded. Please try again later.');
    const runningTask = new TaskProcess(topicId, customerId, TaskProcess.SEND_TOPIC_HISTORY, 'running');
    tasksStore.push(failedTask, runningTask);
    await workflow.execute({ limit: DEFAULT_LIMIT, maxExecutionTimeMs: DEFAULT_MAX_EXECUTION_TIME_MS });
    expect(topicHistoryRepository.save).toHaveBeenCalled();
    const hasSendTaskAny = tasksStore.some(t => t.type === TaskProcess.SEND_TOPIC_HISTORY);
    expect(hasSendTaskAny).toBe(true);
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: TaskProcess.SEND_TOPIC_HISTORY, status: 'completed' }));
  });

  it('sends the topic history email', async () => {
    const workflow = buildWorkflow();
    const failedTask = new TaskProcess(topicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'failed', undefined, 'The model is overloaded. Please try again later.');
    const runningTask = new TaskProcess(topicId, customerId, TaskProcess.SEND_TOPIC_HISTORY, 'running');
    tasksStore.push(failedTask, runningTask);
    await workflow.execute({ limit: DEFAULT_LIMIT, maxExecutionTimeMs: DEFAULT_MAX_EXECUTION_TIME_MS });
    expect(sendTopicHistoryByEmailPort.send).toHaveBeenCalled();
  });

  it('marks each process type as completed', async () => {
    const workflow = buildWorkflow();
    const failedTask = new TaskProcess(topicId, customerId, TaskProcess.GENERATE_TOPIC_HISTORY, 'failed', undefined, 'The model is overloaded. Please try again later.');
    const runningTask = new TaskProcess(topicId, customerId, TaskProcess.SEND_TOPIC_HISTORY, 'running');
    tasksStore.push(failedTask, runningTask);
    await workflow.execute({ limit: DEFAULT_LIMIT, maxExecutionTimeMs: DEFAULT_MAX_EXECUTION_TIME_MS });
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: TaskProcess.PROCESS_FAILED_TOPICS, status: 'completed' }));
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: TaskProcess.CLOSE_TOPIC, status: 'completed' }));
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: TaskProcess.REGENERATE_TOPICS_HISTORIES, status: 'completed' }));
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: TaskProcess.GENERATE_TOPIC_HISTORY, status: 'completed' }));
    expect(taskProcessRepository.save).toHaveBeenCalledWith(expect.objectContaining({ type: TaskProcess.SEND_TOPIC_HISTORY, status: 'completed' }));
  });
});


