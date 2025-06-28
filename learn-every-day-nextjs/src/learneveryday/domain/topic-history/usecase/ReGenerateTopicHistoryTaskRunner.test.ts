import { ReGenerateTopicHistoryTaskRunner, ReGenerateTopicHistoryConfig } from './ReGenerateTopicHistoryTaskRunner';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { Topic } from '../../topic/entities/Topic';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';

describe('ReGenerateTopicHistoryTaskRunner', () => {
  let taskRunner: ReGenerateTopicHistoryTaskRunner;
  let mockTopicRepository: jest.Mocked<TopicRepositoryPort>;
  let mockTopicHistoryRepository: jest.Mocked<TopicHistoryRepositoryPort>;
  let mockTaskProcessRepository: jest.Mocked<TaskProcessRepositoryPort>;
  let mockLogger: jest.Mocked<LoggerPort>;
  
  const customerId = 'customer-123';
  const topicId1 = 'topic-1';
  const topicId2 = 'topic-2';
  const topicId3 = 'topic-3';

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTopicRepository = {
      findByCustomerId: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
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
    } as jest.Mocked<TopicRepositoryPort>;

    mockTopicHistoryRepository = {
      findByTopicId: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
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
    } as jest.Mocked<TopicHistoryRepositoryPort>;

    mockTaskProcessRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByEntityId: jest.fn(),
      findByCustomerId: jest.fn(),
      findByType: jest.fn(),
      findByStatus: jest.fn(),
      findByEntityIdAndType: jest.fn(),
      findPendingTasks: jest.fn(),
      findRunningTasks: jest.fn(),
      findScheduledTasks: jest.fn(),
      findFailedTasks: jest.fn(),
      findPendingTaskProcessByStatusAndType: jest.fn(),
      searchProcessedTasks: jest.fn(),
      delete: jest.fn(),
      deleteByEntityId: jest.fn(),
      deleteByCustomerId: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
      countByType: jest.fn(),
      getTasksCreatedToday: jest.fn(),
      getTasksCreatedThisWeek: jest.fn(),
      getTasksCreatedThisMonth: jest.fn(),
      getTasksScheduledForDate: jest.fn(),
      getTasksScheduledForDateRange: jest.fn(),
    } as jest.Mocked<TaskProcessRepositoryPort>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      child: jest.fn(),
    } as jest.Mocked<LoggerPort>;

    taskRunner = new ReGenerateTopicHistoryTaskRunner(
      mockTopicRepository,
      mockTopicHistoryRepository,
      mockTaskProcessRepository,
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

    const createMockTask = (
      type: string,
      status: string,
      createdAt: Date = new Date()
    ): TaskProcess => {
      return new TaskProcess(
        topicId1,
        customerId,
        type as TaskProcess['type'],
        status as TaskProcess['status'],
        undefined,
        undefined,
        undefined,
        undefined,
        createdAt
      );
    };

    it('should schedule new tasks when customer has less than maxTopicsPer24h completed tasks', async () => {
      // Arrange
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 2 };
      taskRunner.setConfig(config);

      const mockTasks = [
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', new Date()),
        createMockTask(TaskProcess.SEND_TOPIC_HISTORY, 'completed', new Date()),
      ];

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue(mockTasks);
      mockTopicRepository.findByCustomerId.mockResolvedValue(mockTopics);
      mockTopicHistoryRepository.findByTopicId
        .mockResolvedValueOnce([{ id: 'history-1', topicId: topicId1, content: 'content', createdAt: new Date() }]) // 1 history
        .mockResolvedValueOnce([]) // 0 histories
        .mockResolvedValueOnce([{ id: 'history-2', topicId: topicId3, content: 'content', createdAt: new Date() }]); // 1 history

      // Act
      await taskRunner.execute(baseTaskProcess);

      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTaskProcessRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TaskProcess.GENERATE_TOPIC_HISTORY,
          status: 'pending',
          entityId: topicId2,
          scheduledTo: expect.any(Date),
        })
      );
    });

    it('should not schedule new tasks when customer has reached maxTopicsPer24h limit', async () => {
      // Arrange
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 1 };
      taskRunner.setConfig(config);

      const mockTasks = [
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed'),
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed'),
      ];

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue(mockTasks);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockTaskProcessRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('already has 2 processed tasks, which meets the maximum limit of 1 topics per 24h')
      );
    });

    it('should prioritize topics with fewer histories when scheduling tasks', async () => {
      // Arrange
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 2 };
      taskRunner.setConfig(config);

      const mockTasks = [
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed'),
      ];

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue(mockTasks);
      mockTopicRepository.findByCustomerId.mockResolvedValue(mockTopics);
      
      // Topic 1: 3 histories, Topic 2: 0 histories, Topic 3: 1 history
      mockTopicHistoryRepository.findByTopicId
        .mockResolvedValueOnce([
          { id: 'h1', topicId: topicId1, content: 'content', createdAt: new Date() },
          { id: 'h2', topicId: topicId1, content: 'content', createdAt: new Date() },
          { id: 'h3', topicId: topicId1, content: 'content', createdAt: new Date() },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'h4', topicId: topicId3, content: 'content', createdAt: new Date() },
        ]);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      
      // Should schedule task for topic with 0 histories (topicId2)
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0] as TaskProcess;
      expect(savedTask.entityId).toBe(topicId2);
    });

    it('should handle empty search results gracefully', async () => {
      // Arrange
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 1 };
      taskRunner.setConfig(config);

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue([]);
      mockTopicRepository.findByCustomerId.mockResolvedValue(mockTopics);
      mockTopicHistoryRepository.findByTopicId.mockResolvedValue([]);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should use default config when setConfig is not called', async () => {
      // Arrange
      const mockTasks = [
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed'),
      ];

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue(mockTasks);
      mockTopicRepository.findByCustomerId.mockResolvedValue(mockTopics);
      mockTopicHistoryRepository.findByTopicId.mockResolvedValue([]);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      // Should not schedule any tasks because default maxTopicsPer24h is 1 and we have 1 completed task
      expect(mockTaskProcessRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('already has 1 processed tasks, which meets the maximum limit of 1 topics per 24h')
      );
    });

    it('should calculate nextScheduleTime correctly when there is a last SEND_TOPIC_HISTORY task', async () => {
      // Arrange
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 2 };
      taskRunner.setConfig(config);

      const lastSendTaskTime = new Date('2024-01-15T10:00:00Z');
      const expectedNextScheduleTime = new Date(lastSendTaskTime.getTime() + 24 * 60 * 60 * 1000);

      const mockTasks = [
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed'),
        createMockTask(TaskProcess.SEND_TOPIC_HISTORY, 'completed', lastSendTaskTime),
      ];

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue(mockTasks);
      mockTopicRepository.findByCustomerId.mockResolvedValue(mockTopics);
      mockTopicHistoryRepository.findByTopicId.mockResolvedValue([]);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0] as TaskProcess;
      expect(savedTask.scheduledTo).toEqual(expectedNextScheduleTime);
    });

    it('should calculate nextScheduleTime correctly when there is no last SEND_TOPIC_HISTORY task', async () => {
      // Arrange
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 2 };
      taskRunner.setConfig(config);

      const mockTasks = [
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed'),
        // No SEND_TOPIC_HISTORY tasks
      ];

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue(mockTasks);
      mockTopicRepository.findByCustomerId.mockResolvedValue(mockTopics);
      mockTopicHistoryRepository.findByTopicId.mockResolvedValue([]);

      const beforeExecution = new Date();

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0] as TaskProcess;
      const afterExecution = new Date();

      // The scheduledTo should be 24 hours from now (between beforeExecution and afterExecution + 24h)
      const expectedMinTime = new Date(beforeExecution.getTime() + 24 * 60 * 60 * 1000);
      const expectedMaxTime = new Date(afterExecution.getTime() + 24 * 60 * 60 * 1000);

      expect(savedTask.scheduledTo).toBeInstanceOf(Date);
      expect(savedTask.scheduledTo!.getTime()).toBeGreaterThanOrEqual(expectedMinTime.getTime());
      expect(savedTask.scheduledTo!.getTime()).toBeLessThanOrEqual(expectedMaxTime.getTime());
    });

    it('should use the most recent SEND_TOPIC_HISTORY task when multiple exist', async () => {
      // Arrange
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 2 };
      taskRunner.setConfig(config);

      const olderSendTaskTime = new Date('2024-01-15T10:00:00Z');
      const newerSendTaskTime = new Date('2024-01-16T14:00:00Z');
      const expectedNextScheduleTime = new Date(newerSendTaskTime.getTime() + 24 * 60 * 60 * 1000);

      const mockTasks = [
        createMockTask(TaskProcess.GENERATE_TOPIC_HISTORY, 'completed'),
        createMockTask(TaskProcess.SEND_TOPIC_HISTORY, 'completed', olderSendTaskTime),
        createMockTask(TaskProcess.SEND_TOPIC_HISTORY, 'completed', newerSendTaskTime),
      ];

      mockTaskProcessRepository.searchProcessedTasks.mockResolvedValue(mockTasks);
      mockTopicRepository.findByCustomerId.mockResolvedValue(mockTopics);
      mockTopicHistoryRepository.findByTopicId.mockResolvedValue([]);

      // Act
      await taskRunner.execute(baseTaskProcess);

      // Assert
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0] as TaskProcess;
      expect(savedTask.scheduledTo).toEqual(expectedNextScheduleTime);
    });
  });
}); 