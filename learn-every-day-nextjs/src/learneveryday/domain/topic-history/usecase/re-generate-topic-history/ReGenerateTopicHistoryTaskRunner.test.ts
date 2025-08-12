import { ReGenerateTopicHistoryTaskRunner } from './ReGenerateTopicHistoryTaskRunner';
import { ValidateCustomerProcessor } from './ValidateCustomerProcessor';
import { CreateConfigProcessor, ReGenerateTopicHistoryConfig } from './CreateConfigProcessor';
import { AnalyzeTasksProcessor, TaskAnalysis } from './AnalyzeTasksProcessor';
import { SelectTopicsProcessor } from './SelectTopicsProcessor';
import { ScheduleGenerateTasksBatchProcessor } from './ScheduleGenerateTasksBatchProcessor';
import { TaskProcess } from '../../../taskprocess/entities/TaskProcess';
import { Topic } from '../../../topic/entities/Topic';
import { LoggerPort } from '../../../shared/ports/LoggerPort';
import { Customer, CustomerTier } from '../../../customer/entities/Customer';

describe('ReGenerateTopicHistoryTaskRunner', () => {
  let taskRunner: ReGenerateTopicHistoryTaskRunner;
  let mockValidateCustomer: jest.Mocked<ValidateCustomerProcessor>;
  let mockCreateConfig: jest.Mocked<CreateConfigProcessor>;
  let mockAnalyzeTasks: jest.Mocked<AnalyzeTasksProcessor>;
  let mockSelectTopics: jest.Mocked<SelectTopicsProcessor>;
  let mockScheduleBatch: jest.Mocked<ScheduleGenerateTasksBatchProcessor>;
  let mockLogger: jest.Mocked<LoggerPort>;

  const customerId = 'customer-123';
  const topicId1 = 'topic-1';
  const topicId2 = 'topic-2';
  const topicId3 = 'topic-3';

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateCustomer = ({ execute: jest.fn() } as unknown) as jest.Mocked<ValidateCustomerProcessor>;
    mockCreateConfig = ({ execute: jest.fn() } as unknown) as jest.Mocked<CreateConfigProcessor>;
    mockAnalyzeTasks = ({ execute: jest.fn() } as unknown) as jest.Mocked<AnalyzeTasksProcessor>;
    mockSelectTopics = ({ execute: jest.fn() } as unknown) as jest.Mocked<SelectTopicsProcessor>;
    mockScheduleBatch = ({ execute: jest.fn() } as unknown) as jest.Mocked<ScheduleGenerateTasksBatchProcessor>;

    mockLogger = ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      child: jest.fn(),
    } as unknown) as jest.Mocked<LoggerPort>;

    taskRunner = new ReGenerateTopicHistoryTaskRunner(
      mockValidateCustomer,
      mockCreateConfig,
      mockAnalyzeTasks,
      mockSelectTopics,
      mockScheduleBatch,
      mockLogger
    );
  });

  describe('execute', () => {
    const baseTaskProcess = new TaskProcess(
      topicId1,
      customerId,
      TaskProcess.REGENERATE_TOPICS_HISTORIES,
      'pending'
    );

    const mockTopics: Topic[] = [
      new Topic(customerId, 'Topic 1', topicId1),
      new Topic(customerId, 'Topic 2', topicId2),
      new Topic(customerId, 'Topic 3', topicId3),
    ];

    const buildCustomer = (tier: CustomerTier): Customer =>
      Customer.createWithCPF('John Doe', '12345678901', 'john@example.com', '123-456-7890', customerId, tier);

    const buildAnalysis = (
      pendingTasksCount: number,
      lastSendTask: TaskProcess | null
    ): TaskAnalysis => ({
      allTasks: [],
      generateTasks: [],
      pendingTasksCount,
      lastSendTask,
    });

    const buildConfig = (maxTopicsPer24h: number, maxTopicsToProcess = 50): ReGenerateTopicHistoryConfig => ({
      maxTopicsPer24h,
      maxTopicsToProcess,
    });

    it('should schedule new tasks when customer has less than maxTopicsPer24h pending tasks', async () => {
      // Arrange: Standard tier allows 3 per 24h, there is 1 pending → need 2 topics
      mockValidateCustomer.execute.mockResolvedValue(buildCustomer(CustomerTier.Standard));
      mockCreateConfig.execute.mockReturnValue(buildConfig(3));
      mockAnalyzeTasks.execute.mockResolvedValue(buildAnalysis(1, null));
      mockSelectTopics.execute.mockResolvedValue([mockTopics[1], mockTopics[2]]);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockSelectTopics.execute).toHaveBeenCalledWith(customerId, 2, 50);
      expect(mockScheduleBatch.execute).toHaveBeenCalledTimes(1);
      const [, , scheduledDate] = mockScheduleBatch.execute.mock.calls[0];
      expect(scheduledDate).toBeInstanceOf(Date);
    });

    it('should not schedule new tasks when customer has reached maxTopicsPer24h limit', async () => {
      // Arrange: Basic tier allows 1 per 24h, there is 1 pending → do nothing
      mockValidateCustomer.execute.mockResolvedValue(buildCustomer(CustomerTier.Basic));
      mockCreateConfig.execute.mockReturnValue(buildConfig(1));
      mockAnalyzeTasks.execute.mockResolvedValue(buildAnalysis(1, null));

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockSelectTopics.execute).not.toHaveBeenCalled();
      expect(mockScheduleBatch.execute).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('already has 1 pending tasks, which meets the maximum limit of 1 topics per 24h')
      );
    });

    it('should propagate nextScheduleTime based on last SEND_TOPIC_HISTORY task', async () => {
      // Arrange
      mockValidateCustomer.execute.mockResolvedValue(buildCustomer(CustomerTier.Standard));
      mockCreateConfig.execute.mockReturnValue(buildConfig(3));
      const lastSendTaskTime = new Date('2024-01-16T14:00:00Z');
      const lastSendTask = new TaskProcess(topicId1, customerId, TaskProcess.SEND_TOPIC_HISTORY, 'completed', undefined, undefined, undefined, undefined, lastSendTaskTime);
      mockAnalyzeTasks.execute.mockResolvedValue(buildAnalysis(1, lastSendTask));
      mockSelectTopics.execute.mockResolvedValue([mockTopics[1], mockTopics[2]]);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      const [, , scheduledDate] = mockScheduleBatch.execute.mock.calls[0];
      expect(scheduledDate).toEqual(new Date(lastSendTaskTime.getTime() + 24 * 60 * 60 * 1000));
    });

    it('should schedule 24h from now when there is no last SEND_TOPIC_HISTORY task', async () => {
      // Arrange
      mockValidateCustomer.execute.mockResolvedValue(buildCustomer(CustomerTier.Standard));
      mockCreateConfig.execute.mockReturnValue(buildConfig(3));
      mockAnalyzeTasks.execute.mockResolvedValue(buildAnalysis(0, null));
      mockSelectTopics.execute.mockResolvedValue([mockTopics[0], mockTopics[1], mockTopics[2]]);

      const before = new Date();

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      const [, , scheduledDate] = mockScheduleBatch.execute.mock.calls[0];
      const after = new Date();
      const min = new Date(before.getTime() + 24 * 60 * 60 * 1000);
      const max = new Date(after.getTime() + 24 * 60 * 60 * 1000);
      expect((scheduledDate as Date).getTime()).toBeGreaterThanOrEqual(min.getTime());
      expect((scheduledDate as Date).getTime()).toBeLessThanOrEqual(max.getTime());
    });

    it('should return early when customer is not found', async () => {
      // Arrange
      mockValidateCustomer.execute.mockResolvedValue(null);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockCreateConfig.execute).not.toHaveBeenCalled();
      expect(mockAnalyzeTasks.execute).not.toHaveBeenCalled();
      expect(mockSelectTopics.execute).not.toHaveBeenCalled();
      expect(mockScheduleBatch.execute).not.toHaveBeenCalled();
    });
  });
});