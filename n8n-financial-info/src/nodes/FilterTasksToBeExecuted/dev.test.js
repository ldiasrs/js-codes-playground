/**
 * Teste de desenvolvimento único para FilterTasksToBeExecuted
 */

const {
  filterTasksToExecute
} = require('./index');

describe('Teste de desenvolvimento - Tarefa sem execução', () => {
  it('deve retornar a tarefa "Estoicismo Semanal" pois nunca foi executada', () => {
    // Tarefa DAILY que deve executar todo dia
    const tasks = [
      {
        Id: 2,
        Subject: 'Estoicismo Semanal',
        ScheduledType: 'WEEKLY',
        ScheduledPeriod: 1,
        ScheduledDay: 'Monday',
        ScheduledTime: '17:00',
        Prompt: '5 frases de Estoicos importantes'
      }
    ];
    
    // Nenhuma execução anterior
    const executions = [];
    
    // Data de teste: qualquer dia
    const today = new Date(2025, 11, 10); // 10 de novembro de 2025
    
    const result = filterTasksToExecute(tasks, executions, today);
    
    // Deve retornar a tarefa pois nunca foi executada
    expect(result).toHaveLength(1);
    expect(result[0].Id).toBe(2);
    expect(result[0].Subject).toBe('Estoicismo Semanal');
    expect(result[0].Prompt).toBe('5 frases de Estoicos importantes');
    expect(result[0].HistoryCount).toBe(0);
  });
});

