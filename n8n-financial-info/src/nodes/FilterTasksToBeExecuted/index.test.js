/**
 * Testes unitários para FilterTasksToBeExecuted
 */

const {
  parseExecutionDate,
  isToday,
  getLastExecution,
  getLastNExecutions,
  shouldExecuteDaily,
  shouldExecuteWeekly,
  shouldExecuteMonthly,
  shouldExecuteTask,
  buildPromptWithHistory,
  filterTasksToExecute,
  ScheduleType
} = require('./index');

describe('FilterTasksToBeExecuted', () => {
  
  describe('parseExecutionDate', () => {
    it('deve parsear data corretamente', () => {
      const dateStr = '08/11/2025 14:30:00';
      const result = parseExecutionDate(dateStr);
      
      expect(result.getDate()).toBe(8);
      expect(result.getMonth()).toBe(10); // Novembro é mês 10 (0-based)
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('deve parsear data com zeros à esquerda', () => {
      const dateStr = '01/01/2025 08:05:03';
      const result = parseExecutionDate(dateStr);
      
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0);
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(5);
      expect(result.getSeconds()).toBe(3);
    });
  });

  describe('isToday', () => {
    it('deve retornar true para data de hoje', () => {
      const today = new Date(2025, 10, 8);
      const testDate = new Date(2025, 10, 8, 14, 30);
      
      expect(isToday(testDate, today)).toBe(true);
    });

    it('deve retornar false para data diferente', () => {
      const today = new Date(2025, 10, 8);
      const testDate = new Date(2025, 10, 7);
      
      expect(isToday(testDate, today)).toBe(false);
    });

    it('deve considerar apenas data, não hora', () => {
      const today = new Date(2025, 10, 8, 10, 0);
      const testDate = new Date(2025, 10, 8, 23, 59);
      
      expect(isToday(testDate, today)).toBe(true);
    });
  });

  describe('getLastExecution', () => {
    const executions = [
      { Id: 1, ExecutionTime: '05/11/2025 10:00:00', Saida: 'Output 1' },
      { Id: 1, ExecutionTime: '07/11/2025 10:00:00', Saida: 'Output 2' },
      { Id: 1, ExecutionTime: '06/11/2025 10:00:00', Saida: 'Output 3' },
      { Id: 2, ExecutionTime: '08/11/2025 10:00:00', Saida: 'Output 4' }
    ];

    it('deve retornar a execução mais recente', () => {
      const result = getLastExecution(1, executions);
      expect(result.getDate()).toBe(7);
      expect(result.getMonth()).toBe(10);
    });

    it('deve retornar null se não houver execuções', () => {
      const result = getLastExecution(999, executions);
      expect(result).toBeNull();
    });

    it('deve filtrar apenas execuções da task específica', () => {
      const result = getLastExecution(2, executions);
      expect(result.getDate()).toBe(8);
    });
  });

  describe('getLastNExecutions', () => {
    const executions = [
      { Id: 1, ExecutionTime: '05/11/2025 10:00:00', Saida: 'Output 1' },
      { Id: 1, ExecutionTime: '07/11/2025 10:00:00', Saida: 'Output 2' },
      { Id: 1, ExecutionTime: '06/11/2025 10:00:00', Saida: 'Output 3' },
      { Id: 1, ExecutionTime: '04/11/2025 10:00:00', Saida: 'Output 4' }
    ];

    it('deve retornar as últimas 3 execuções ordenadas', () => {
      const result = getLastNExecutions(1, executions, 3);
      
      expect(result).toHaveLength(3);
      expect(result[0].output).toBe('Output 2'); // 07/11 (mais recente)
      expect(result[1].output).toBe('Output 3'); // 06/11
      expect(result[2].output).toBe('Output 1'); // 05/11
    });

    it('deve retornar array vazio se não houver execuções', () => {
      const result = getLastNExecutions(999, executions, 3);
      expect(result).toHaveLength(0);
    });

    it('deve respeitar o limite N', () => {
      const result = getLastNExecutions(1, executions, 2);
      expect(result).toHaveLength(2);
    });

    it('deve incluir dateStr e output', () => {
      const result = getLastNExecutions(1, executions, 1);
      expect(result[0]).toHaveProperty('dateStr');
      expect(result[0]).toHaveProperty('output');
      expect(result[0]).toHaveProperty('date');
    });
  });

  describe('shouldExecuteDaily', () => {
    it('deve executar se nunca foi executada', () => {
      const task = { ScheduledPeriod: 1 };
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteDaily(task, null, today)).toBe(true);
    });

    it('deve executar se última execução foi ontem', () => {
      const task = { ScheduledPeriod: 1 };
      const lastExecution = new Date(2025, 10, 7);
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteDaily(task, lastExecution, today)).toBe(true);
    });

    it('NÃO deve executar se já executou hoje', () => {
      const task = { ScheduledPeriod: 1 };
      const lastExecution = new Date(2025, 10, 8, 10, 0);
      const today = new Date(2025, 10, 8, 14, 0);
      
      expect(shouldExecuteDaily(task, lastExecution, today)).toBe(false);
    });

    it('deve respeitar período maior que 1', () => {
      const task = { ScheduledPeriod: 3 };
      const lastExecution = new Date(2025, 10, 6); // 2 dias atrás
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteDaily(task, lastExecution, today)).toBe(false);
    });

    it('deve executar quando período é atingido', () => {
      const task = { ScheduledPeriod: 3 };
      const lastExecution = new Date(2025, 10, 5); // 3 dias atrás
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteDaily(task, lastExecution, today)).toBe(true);
    });
  });

  describe('shouldExecuteWeekly', () => {
    it('deve executar na segunda-feira correta', () => {
      const task = { ScheduledDay: 'Monday', ScheduledPeriod: 1 };
      const today = new Date(2025, 10, 10); // 10/11/2025 é segunda
      
      expect(shouldExecuteWeekly(task, null, today)).toBe(true);
    });

    it('NÃO deve executar em dia errado da semana', () => {
      const task = { ScheduledDay: 'Monday', ScheduledPeriod: 1 };
      const today = new Date(2025, 10, 8); // 08/11/2025 é sábado
      
      expect(shouldExecuteWeekly(task, null, today)).toBe(false);
    });

    it('NÃO deve executar se já executou hoje', () => {
      const task = { ScheduledDay: 'Monday', ScheduledPeriod: 1 };
      const lastExecution = new Date(2025, 10, 10, 8, 0);
      const today = new Date(2025, 10, 10, 14, 0);
      
      expect(shouldExecuteWeekly(task, lastExecution, today)).toBe(false);
    });

    it('deve respeitar período de semanas', () => {
      const task = { ScheduledDay: 'Monday', ScheduledPeriod: 2 };
      const lastExecution = new Date(2025, 10, 3); // 1 semana atrás
      const today = new Date(2025, 10, 10); // Segunda-feira
      
      expect(shouldExecuteWeekly(task, lastExecution, today)).toBe(false);
    });
  });

  describe('shouldExecuteMonthly', () => {
    it('deve executar no dia correto do mês', () => {
      const task = { ScheduledDay: '8', ScheduledPeriod: 1 };
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteMonthly(task, null, today)).toBe(true);
    });

    it('NÃO deve executar em dia errado do mês', () => {
      const task = { ScheduledDay: '15', ScheduledPeriod: 1 };
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteMonthly(task, null, today)).toBe(false);
    });

    it('NÃO deve executar se já executou hoje', () => {
      const task = { ScheduledDay: '8', ScheduledPeriod: 1 };
      const lastExecution = new Date(2025, 10, 8, 8, 0);
      const today = new Date(2025, 10, 8, 14, 0);
      
      expect(shouldExecuteMonthly(task, lastExecution, today)).toBe(false);
    });

    it('deve calcular diferença de meses corretamente', () => {
      const task = { ScheduledDay: '8', ScheduledPeriod: 2 };
      const lastExecution = new Date(2025, 9, 8); // 1 mês atrás
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteMonthly(task, lastExecution, today)).toBe(false);
    });
  });

  describe('shouldExecuteTask', () => {
    it('deve chamar shouldExecuteDaily para DAILY', () => {
      const task = { ScheduledType: 'DAILY', ScheduledPeriod: 1 };
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteTask(task, null, today)).toBe(true);
    });

    it('deve chamar shouldExecuteWeekly para WEEKLY', () => {
      const task = { 
        ScheduledType: 'WEEKLY',
        ScheduledDay: 'Saturday',
        ScheduledPeriod: 1 
      };
      const today = new Date(2025, 10, 8); // Sábado
      
      expect(shouldExecuteTask(task, null, today)).toBe(true);
    });

    it('deve chamar shouldExecuteMonthly para MONTHLY', () => {
      const task = { 
        ScheduledType: 'MONTLY', // Typo intencional
        ScheduledDay: '8',
        ScheduledPeriod: 1 
      };
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteTask(task, null, today)).toBe(true);
    });

    it('deve retornar false para tipo desconhecido', () => {
      const task = { ScheduledType: 'UNKNOWN' };
      const today = new Date(2025, 10, 8);
      
      expect(shouldExecuteTask(task, null, today)).toBe(false);
    });
  });

  describe('buildPromptWithHistory', () => {
    it('deve retornar prompt original se não houver histórico', () => {
      const task = { Prompt: 'Me dê 5 ideias' };
      const result = buildPromptWithHistory(task, []);
      
      expect(result).toBe('Me dê 5 ideias');
    });

    it('deve adicionar histórico ao prompt', () => {
      const task = { Prompt: 'Me dê 5 ideias' };
      const history = [
        { dateStr: '07/11/2025 10:00:00', output: 'Ideia 1' },
        { dateStr: '06/11/2025 10:00:00', output: 'Ideia 2' }
      ];
      
      const result = buildPromptWithHistory(task, history);
      
      expect(result).toContain('Me dê 5 ideias');
      expect(result).toContain('HISTÓRICO DAS ÚLTIMAS EXECUÇÕES');
      expect(result).toContain('Ideia 1');
      expect(result).toContain('Ideia 2');
      expect(result).toContain('IMPORTANTE');
    });

    it('deve numerar execuções corretamente', () => {
      const task = { Prompt: 'Prompt teste' };
      const history = [
        { dateStr: '07/11/2025 10:00:00', output: 'Output 1' },
        { dateStr: '06/11/2025 10:00:00', output: 'Output 2' },
        { dateStr: '05/11/2025 10:00:00', output: 'Output 3' }
      ];
      
      const result = buildPromptWithHistory(task, history);
      
      expect(result).toContain('1. Execução em 07/11/2025 10:00:00');
      expect(result).toContain('2. Execução em 06/11/2025 10:00:00');
      expect(result).toContain('3. Execução em 05/11/2025 10:00:00');
    });
  });

  describe('filterTasksToExecute', () => {
    // Silenciar console.log durante os testes
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
    });

    const tasks = [
      {
        Id: 1,
        Subject: 'Task Diária',
        ScheduledType: 'DAILY',
        ScheduledPeriod: 1,
        Prompt: 'Prompt 1'
      },
      {
        Id: 2,
        Subject: 'Task Semanal',
        ScheduledType: 'WEEKLY',
        ScheduledDay: 'Saturday',
        ScheduledPeriod: 1,
        Prompt: 'Prompt 2'
      },
      {
        Id: 3,
        Subject: 'Task Mensal',
        ScheduledType: 'MONTLY',
        ScheduledDay: '8',
        ScheduledPeriod: 1,
        Prompt: 'Prompt 3'
      }
    ];

    const executions = [
      { Id: 1, ExecutionTime: '07/11/2025 10:00:00', Saida: 'Output 1' },
      { Id: 1, ExecutionTime: '06/11/2025 10:00:00', Saida: 'Output 2' }
    ];

    it('deve filtrar e retornar tasks que devem executar', () => {
      const today = new Date(2025, 10, 8); // Sábado, 08/11/2025
      const emails = [];
      const result = filterTasksToExecute(tasks, executions, emails, today);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('Prompt');
      expect(result[0]).toHaveProperty('HistoryCount');
    });

    it('deve enriquecer prompts com histórico', () => {
      const today = new Date(2025, 10, 8);
      const emails = [];
      const result = filterTasksToExecute(tasks, executions, emails, today);
      
      const taskWithHistory = result.find(t => t.Id === 1);
      if (taskWithHistory) {
        expect(taskWithHistory.Prompt).toContain('HISTÓRICO');
        expect(taskWithHistory.HistoryCount).toBe(2);
      }
    });

    it('deve retornar array vazio se nenhuma task deve executar', () => {
      const today = new Date(2025, 10, 9); // Domingo - nenhuma task configurada
      const futureExecs = [
        { Id: 1, ExecutionTime: '09/11/2025 10:00:00', Saida: 'Output' }
      ];
      const emails = [];
      const result = filterTasksToExecute(tasks, futureExecs, emails, today);
      
      expect(result).toHaveLength(0);
    });

    it('deve manter propriedades originais das tasks', () => {
      const today = new Date(2025, 10, 8);
      const emails = [];
      const result = filterTasksToExecute(tasks, executions, emails, today);
      
      result.forEach(task => {
        expect(task).toHaveProperty('Id');
        expect(task).toHaveProperty('Subject');
        expect(task).toHaveProperty('ScheduledType');
      });
    });
  });
});

