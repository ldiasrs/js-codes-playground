/**
 * Teste de desenvolvimento manual para FilterTasksToBeExecuted
 * Edite as tasks, executions e emails abaixo para testar cenários específicos
 */

const {
  filterTasksToExecute
} = require('./index');

describe('Teste de desenvolvimento manual', () => {
  it('deve executar tasks conforme configuração manual', () => {
    // ========================================
    // EDITE AQUI: Lista de tasks
    // ========================================
    const tasks = [
      {
        Id: 1,
        Subject: 'Tarefa Diária',
        ScheduledType: 'DAILY',
        ScheduledPeriod: 1,
        ScheduledDay: null,
        ScheduledTime: '09:00',
        Prompt: 'Prompt da tarefa diária'
      },
      {
        Id: 2,
        Subject: 'Estoicismo Semanal',
        ScheduledType: 'WEEKLY',
        ScheduledPeriod: 1,
        ScheduledDay: 'Monday',
        ScheduledTime: '17:00',
        Prompt: '5 frases de Estoicos importantes'
      },
      {
        Id: 3,
        Subject: 'Relatório Mensal',
        ScheduledType: 'MONTLY',
        ScheduledPeriod: 1,
        ScheduledDay: '1',
        ScheduledTime: '09:00',
        Prompt: 'Gerar relatório mensal'
      }
    ];

    // ========================================
    // EDITE AQUI: Histórico de execuções
    // ========================================
    const executions = [
      // Exemplo: { Id: 1, ExecutionTime: '10/11/2025 09:30:00', Saida: 'Output da execução' }
    ];

    // ========================================
    // EDITE AQUI: Emails por task
    // ========================================
    const emails = [
      { Id: 1, email: 'ldias.rs@gmail.com' },
      { Id: 1, email: 'ldias4@gmail.com' },
      { Id: 2, email: 'ldias.rs@gmail.com' },
      { Id: 3, email: 'ldias.rs@gmail.com' }
    ];

    // ========================================
    // EDITE AQUI: Data/hora do teste
    // ========================================
    // Formato: new Date(ano, mês-1, dia, hora, minuto)
    // Exemplo: new Date(2025, 10, 10, 17, 0) = 10/11/2025 às 17:00
    const today = new Date(2025, 10, 10, 17, 0); // Segunda-feira, 10/11/2025 às 17:00

    // ========================================
    // Executar filtro
    // ========================================
    const result = filterTasksToExecute(tasks, executions, emails, today);

    // ========================================
    // Resultados
    // ========================================
    console.log('\n📋 RESULTADO DO TESTE:');
    console.log(`Total de tasks para executar: ${result.length}`);
    
    result.forEach(task => {
      console.log(`\n✅ Task ID ${task.Id}: ${task.Subject}`);
      console.log(`   Emails: ${task.Emails.join(', ')}`);
      console.log(`   Histórico: ${task.HistoryCount} execuções`);
    });

    // Validações básicas
    expect(result).toBeInstanceOf(Array);
    result.forEach(task => {
      expect(task).toHaveProperty('Id');
      expect(task).toHaveProperty('Subject');
      expect(task).toHaveProperty('Prompt');
      expect(task).toHaveProperty('Emails');
      expect(task).toHaveProperty('HistoryCount');
    });
  });
});
