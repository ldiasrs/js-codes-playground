/**
 * Teste de desenvolvimento para FilterTasksToBeExecuted
 * Testa execução semanal com horário agendado
 */

const {
  filterTasksToExecute,
  hasScheduledTimePassed
} = require('./index');

describe('Teste de desenvolvimento - Tarefa semanal com horário', () => {
  const task = {
    Id: 2,
    Subject: 'Estoicismo Semanal',
    ScheduledType: 'WEEKLY',
    ScheduledPeriod: 1,
    ScheduledDay: 'Monday',
    ScheduledTime: '17:00',
    Prompt: '5 frases de Estoicos importantes'
  };

  describe('Verificação de horário', () => {
    it('deve retornar false se o horário ainda não passou', () => {
      const beforeTime = new Date(2025, 10, 10, 16, 59); // 16:59
      expect(hasScheduledTimePassed('17:00', beforeTime)).toBe(false);
    });

    it('deve retornar true se o horário já passou', () => {
      const afterTime = new Date(2025, 10, 10, 17, 1); // 17:01
      expect(hasScheduledTimePassed('17:00', afterTime)).toBe(true);
    });

    it('deve retornar true se for exatamente o horário', () => {
      const exactTime = new Date(2025, 10, 10, 17, 0); // 17:00
      expect(hasScheduledTimePassed('17:00', exactTime)).toBe(true);
    });
  });

  describe('Execução semanal', () => {
    it('NÃO deve executar na segunda-feira antes das 17h (horário não passou)', () => {
      const executions = [];
      const mondayBeforeTime = new Date(2025, 10, 10, 16, 30); // Segunda, 16:30
      
      const result = filterTasksToExecute([task], executions, mondayBeforeTime);
      
      expect(result).toHaveLength(0);
    });

    it('DEVE executar na segunda-feira às 17h (horário exato, sem execução anterior)', () => {
      const executions = [];
      const mondayAtTime = new Date(2025, 10, 10, 17, 0); // Segunda, 17:00
      
      const result = filterTasksToExecute([task], executions, mondayAtTime);
      
      expect(result).toHaveLength(1);
      expect(result[0].Id).toBe(2);
      expect(result[0].Subject).toBe('Estoicismo Semanal');
      expect(result[0].HistoryCount).toBe(0);
    });

    it('DEVE executar na segunda-feira depois das 17h (horário passou, sem execução anterior)', () => {
      const executions = [];
      const mondayAfterTime = new Date(2025, 10, 10, 18, 30); // Segunda, 18:30
      
      const result = filterTasksToExecute([task], executions, mondayAfterTime);
      
      expect(result).toHaveLength(1);
      expect(result[0].Id).toBe(2);
    });

    it('NÃO deve executar na terça-feira (dia errado)', () => {
      const executions = [];
      const tuesday = new Date(2025, 10, 11, 18, 0); // Terça, 18:00
      
      const result = filterTasksToExecute([task], executions, tuesday);
      
      expect(result).toHaveLength(0);
    });

    it('NÃO deve executar na segunda-feira se já executou hoje', () => {
      const executions = [
        {
          Id: 2,
          ExecutionTime: '10/11/2025 17:05:00',
          Saida: 'Execução anterior'
        }
      ];
      const mondayLater = new Date(2025, 10, 10, 20, 0); // Segunda, 20:00 (mesmo dia)
      
      const result = filterTasksToExecute([task], executions, mondayLater);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Execução mensal', () => {
    const monthlyTask = {
      Id: 3,
      Subject: 'Relatório Mensal',
      ScheduledType: 'MONTLY', // Note: grafia conforme definido no ScheduleType
      ScheduledPeriod: 1,
      ScheduledDay: '1', // Dia 1 do mês
      ScheduledTime: '09:00',
      Prompt: 'Gerar relatório mensal'
    };

    it('NÃO deve executar no dia 1 antes das 09h (horário não passou)', () => {
      const executions = [];
      const firstDayBeforeTime = new Date(2025, 11, 1, 8, 30); // Dia 1, 08:30
      
      const result = filterTasksToExecute([monthlyTask], executions, firstDayBeforeTime);
      
      expect(result).toHaveLength(0);
    });

    it('DEVE executar no dia 1 às 09h (horário exato, sem execução anterior)', () => {
      const executions = [];
      const firstDayAtTime = new Date(2025, 11, 1, 9, 0); // Dia 1, 09:00
      
      const result = filterTasksToExecute([monthlyTask], executions, firstDayAtTime);
      
      expect(result).toHaveLength(1);
      expect(result[0].Id).toBe(3);
      expect(result[0].Subject).toBe('Relatório Mensal');
    });

    it('DEVE executar no dia 1 depois das 09h (horário passou, sem execução anterior)', () => {
      const executions = [];
      const firstDayAfterTime = new Date(2025, 11, 1, 14, 0); // Dia 1, 14:00
      
      const result = filterTasksToExecute([monthlyTask], executions, firstDayAfterTime);
      
      expect(result).toHaveLength(1);
      expect(result[0].Id).toBe(3);
    });

    it('NÃO deve executar no dia 2 (dia errado)', () => {
      const executions = [];
      const secondDay = new Date(2025, 11, 2, 10, 0); // Dia 2, 10:00
      
      const result = filterTasksToExecute([monthlyTask], executions, secondDay);
      
      expect(result).toHaveLength(0);
    });

    it('NÃO deve executar no dia 1 se já executou hoje', () => {
      const executions = [
        {
          Id: 3,
          ExecutionTime: '01/12/2025 09:05:00',
          Saida: 'Relatório executado'
        }
      ];
      const firstDayLater = new Date(2025, 11, 1, 18, 0); // Dia 1, 18:00 (mesmo dia)
      
      const result = filterTasksToExecute([monthlyTask], executions, firstDayLater);
      
      expect(result).toHaveLength(0);
    });
  });
});
