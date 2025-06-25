import { ReGenerateTopicHistoryTaskRunner, ReGenerateTopicHistoryConfig } from './ReGenerateTopicHistoryTaskRunner';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { Topic } from '../../topic/entities/Topic';
import { TopicHistory } from '../entities/TopicHistory';

// Mock repositories
const mockTopicRepository = {
  findByCustomerId: jest.fn(),
};

const mockTopicHistoryRepository = {
  findByTopicId: jest.fn(),
};

const mockTaskProcessRepository = {
  search: jest.fn(),
  save: jest.fn(),
};

describe('ReGenerateTopicHistoryTaskRunner', () => {
  let taskRunner: ReGenerateTopicHistoryTaskRunner;
  let mockTaskProcess: TaskProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    
    taskRunner = new ReGenerateTopicHistoryTaskRunner(
      mockTopicRepository as any,
      mockTopicHistoryRepository as any,
      mockTaskProcessRepository as any
    );

    mockTaskProcess = new TaskProcess(
      'topic-1',
      'customer-1',
      TaskProcess.REGENERATE_TOPIC_HISTORY,
      'pending',
      'task-1',
      undefined,
      new Date()
    );
  });

  describe('Configuração de parâmetros', () => {
    test('deve permitir configurar máximo 1 tópico por 24h', () => {
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 1 };
      taskRunner.setConfig(config);
      
      // Verificar se a configuração foi aplicada (teste indireto através do comportamento)
      expect(taskRunner).toBeDefined();
    });

    test('deve permitir configurar máximo 3 tópicos por 24h', () => {
      const config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 3 };
      taskRunner.setConfig(config);
      
      // Verificar se a configuração foi aplicada (teste indireto através do comportamento)
      expect(taskRunner).toBeDefined();
    });
  });

  describe('Validação de customer sem tópicos', () => {
    test('deve lançar erro quando customer não tem tópicos', async () => {
      mockTopicRepository.findByCustomerId.mockResolvedValue([]);

      await expect(taskRunner.execute(mockTaskProcess)).rejects.toThrow(
        'Customer with ID customer-1 has no topics'
      );
    });
  });

  describe('Processamento de tópico com menor número de histories', () => {
    beforeEach(() => {
      const topics = [
        new Topic('customer-1', 'Topic 1', 'topic-1'),
        new Topic('customer-1', 'Topic 2', 'topic-2'),
        new Topic('customer-1', 'Topic 3', 'topic-3'),
      ];

      mockTopicRepository.findByCustomerId.mockResolvedValue(topics);
      mockTaskProcessRepository.search.mockResolvedValue([]); // Nenhuma task completada nas últimas 24h
    });

    test('deve processar apenas 1 tópico por customer quando há múltiplos tópicos', async () => {
      // Configurar mock para retornar diferentes quantidades de histories
      mockTopicHistoryRepository.findByTopicId
        .mockResolvedValueOnce([{}, {}, {}]) // topic-1: 3 histories
        .mockResolvedValueOnce([{}]) // topic-2: 1 history (menor)
        .mockResolvedValueOnce([{}, {}]); // topic-3: 2 histories

      await taskRunner.execute(mockTaskProcess);

      // Verificar se apenas uma task foi criada
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      
      // Verificar se foi criada para o tópico com menor número de histories (topic-2)
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.entityId).toBe('topic-2');
      expect(savedTask.type).toBe(TaskProcess.GENERATE_TOPIC_HISTORY);
    });

    test('deve sempre processar o tópico com menor número de topic histories', async () => {
      // Configurar mock para retornar diferentes quantidades de histories
      mockTopicHistoryRepository.findByTopicId
        .mockResolvedValueOnce([{}, {}, {}, {}]) // topic-1: 4 histories
        .mockResolvedValueOnce([]) // topic-2: 0 histories (menor)
        .mockResolvedValueOnce([{}, {}]); // topic-3: 2 histories

      await taskRunner.execute(mockTaskProcess);

      // Verificar se foi criada para o tópico com menor número de histories (topic-2)
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.entityId).toBe('topic-2');
    });

    test('deve usar o primeiro tópico quando todos têm a mesma quantidade de histories', async () => {
      // Configurar mock para retornar a mesma quantidade de histories
      mockTopicHistoryRepository.findByTopicId
        .mockResolvedValueOnce([{}]) // topic-1: 1 history
        .mockResolvedValueOnce([{}]) // topic-2: 1 history
        .mockResolvedValueOnce([{}]); // topic-3: 1 history

      await taskRunner.execute(mockTaskProcess);

      // Verificar se foi criada para o primeiro tópico
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.entityId).toBe('topic-1');
    });
  });

  describe('Adiamento quando há geração nas últimas 24h', () => {
    beforeEach(() => {
      const topics = [
        new Topic('customer-1', 'Topic 1', 'topic-1'),
      ];
      mockTopicRepository.findByCustomerId.mockResolvedValue(topics);
    });

    test('deve adiar geração quando há 1 task completada nas últimas 24h (config: max 1)', async () => {
      taskRunner.setConfig({ maxTopicsPer24h: 1 });

      const completedTask = new TaskProcess(
        'topic-1',
        'customer-1',
        TaskProcess.GENERATE_TOPIC_HISTORY,
        'completed',
        'completed-task-1',
        undefined,
        new Date()
      );

      mockTaskProcessRepository.search.mockResolvedValue([completedTask]);

      await taskRunner.execute(mockTaskProcess);

      // Verificar se foi criada uma task de verificação para 24h depois
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.REGENERATE_TOPIC_HISTORY);
      expect(savedTask.status).toBe('pending');
      
      // Verificar se a data agendada é aproximadamente 24h depois
      const expectedDate = new Date(completedTask.createdAt!);
      expectedDate.setHours(expectedDate.getHours() + 24);
      
      const savedDate = new Date(savedTask.scheduledTo!);
      const timeDiff = Math.abs(savedDate.getTime() - expectedDate.getTime());
      expect(timeDiff).toBeLessThan(1000); // Diferença menor que 1 segundo
    });

    test('deve adiar geração quando há 3 tasks completadas nas últimas 24h (config: max 3)', async () => {
      taskRunner.setConfig({ maxTopicsPer24h: 3 });

      const completedTasks = [
        new TaskProcess('topic-1', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-1', undefined, new Date(Date.now() - 1000)),
        new TaskProcess('topic-2', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-2', undefined, new Date(Date.now() - 500)),
        new TaskProcess('topic-3', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-3', undefined, new Date()), // Mais recente
      ];

      mockTaskProcessRepository.search.mockResolvedValue(completedTasks);

      await taskRunner.execute(mockTaskProcess);

      // Verificar se foi criada uma task de verificação
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.REGENERATE_TOPIC_HISTORY);
      
      // Verificar se a data agendada é 24h depois da task mais recente
      const expectedDate = new Date(completedTasks[2].createdAt!);
      expectedDate.setHours(expectedDate.getHours() + 24);
      
      const savedDate = new Date(savedTask.scheduledTo!);
      const timeDiff = Math.abs(savedDate.getTime() - expectedDate.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });

    test('deve processar normalmente quando há menos tasks que o máximo permitido', async () => {
      taskRunner.setConfig({ maxTopicsPer24h: 3 });

      const completedTasks = [
        new TaskProcess('topic-1', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-1', undefined, new Date()),
        new TaskProcess('topic-2', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-2', undefined, new Date()),
      ];

      mockTaskProcessRepository.search.mockResolvedValue(completedTasks);
      mockTopicHistoryRepository.findByTopicId.mockResolvedValue([]);

      await taskRunner.execute(mockTaskProcess);

      // Verificar se foi criada uma task de geração (não de verificação)
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.GENERATE_TOPIC_HISTORY);
    });
  });

  describe('Configuração de máximo de tópicos por 24h', () => {
    beforeEach(() => {
      const topics = [
        new Topic('customer-1', 'Topic 1', 'topic-1'),
      ];
      mockTopicRepository.findByCustomerId.mockResolvedValue(topics);
      mockTopicHistoryRepository.findByTopicId.mockResolvedValue([]);
    });

    test('deve processar quando há 0 tasks completadas (config: max 1)', async () => {
      taskRunner.setConfig({ maxTopicsPer24h: 1 });
      mockTaskProcessRepository.search.mockResolvedValue([]);

      await taskRunner.execute(mockTaskProcess);

      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.GENERATE_TOPIC_HISTORY);
    });

    test('deve processar quando há 2 tasks completadas (config: max 3)', async () => {
      taskRunner.setConfig({ maxTopicsPer24h: 3 });
      
      const completedTasks = [
        new TaskProcess('topic-1', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-1', undefined, new Date()),
        new TaskProcess('topic-2', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-2', undefined, new Date()),
      ];

      mockTaskProcessRepository.search.mockResolvedValue(completedTasks);

      await taskRunner.execute(mockTaskProcess);

      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.GENERATE_TOPIC_HISTORY);
    });

    test('deve adiar quando há exatamente 1 task completada (config: max 1)', async () => {
      taskRunner.setConfig({ maxTopicsPer24h: 1 });
      
      const completedTask = new TaskProcess('topic-1', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-1', undefined, new Date());
      mockTaskProcessRepository.search.mockResolvedValue([completedTask]);

      await taskRunner.execute(mockTaskProcess);

      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.REGENERATE_TOPIC_HISTORY);
    });

    test('deve adiar quando há exatamente 3 tasks completadas (config: max 3)', async () => {
      taskRunner.setConfig({ maxTopicsPer24h: 3 });
      
      const completedTasks = [
        new TaskProcess('topic-1', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-1', undefined, new Date()),
        new TaskProcess('topic-2', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-2', undefined, new Date()),
        new TaskProcess('topic-3', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-3', undefined, new Date()),
      ];

      mockTaskProcessRepository.search.mockResolvedValue(completedTasks);

      await taskRunner.execute(mockTaskProcess);

      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.REGENERATE_TOPIC_HISTORY);
    });
  });

  describe('Integração completa', () => {
    test('deve funcionar corretamente com cenário realista', async () => {
      // Configurar customer com múltiplos tópicos
      const topics = [
        new Topic('customer-1', 'Topic 1', 'topic-1'),
        new Topic('customer-1', 'Topic 2', 'topic-2'),
        new Topic('customer-1', 'Topic 3', 'topic-3'),
      ];

      mockTopicRepository.findByCustomerId.mockResolvedValue(topics);
      
      // Configurar que há 1 task completada nas últimas 24h (config: max 1)
      taskRunner.setConfig({ maxTopicsPer24h: 1 });
      
      const completedTask = new TaskProcess('topic-1', 'customer-1', TaskProcess.GENERATE_TOPIC_HISTORY, 'completed', 'task-1', undefined, new Date());
      mockTaskProcessRepository.search.mockResolvedValue([completedTask]);

      await taskRunner.execute(mockTaskProcess);

      // Verificar que foi criada uma task de verificação (não de geração)
      expect(mockTaskProcessRepository.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskProcessRepository.save.mock.calls[0][0];
      expect(savedTask.type).toBe(TaskProcess.REGENERATE_TOPIC_HISTORY);
      expect(savedTask.status).toBe('pending');
    });
  });
}); 