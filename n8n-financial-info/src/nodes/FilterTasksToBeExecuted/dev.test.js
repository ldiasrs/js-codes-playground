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
        "row_number": 2,
        "Id": 1,
        "Subject": "Jantas da Semana",
        "ScheduledType": "WEEKLY",
        "ScheduledPeriod": 1,
        "ScheduledDay": "Thursday",
        "ScheduledTime": "09:00",
        "Prompt": "ID-1"
      },
      {
        "row_number": 3,
        "Id": 2,
        "Subject": "Estoicismo",
        "ScheduledType": "DAILY",
        "ScheduledPeriod": 1,
        "ScheduledDay": 1,
        "ScheduledTime": "08:00",
        "Prompt": "ID-2"
      },
      {
        "row_number": 4,
        "Id": 3,
        "Subject": "Dicas de Livros",
        "ScheduledType": "MOUNTHLY",
        "ScheduledPeriod": 1,
        "ScheduledDay": 1,
        "ScheduledTime": "08:00",
        "Prompt": "ID-3"
      },
      {
        "row_number": 5,
        "Id": 4,
        "Subject": "Stocks",
        "ScheduledType": "MOUNTHLY",
        "ScheduledPeriod": 1,
        "ScheduledDay": 1,
        "ScheduledTime": "08:00",
        "Prompt": "ID-4"
      },
      {
        "row_number": 6,
        "Id": 5,
        "Subject": "Budismo",
        "ScheduledType": "DAILY",
        "ScheduledPeriod": 1,
        "ScheduledDay": 1,
        "ScheduledTime": "08:00",
        "Prompt": "ID-5"
      },
      {
        "row_number": 7,
        "Id": 6,
        "Subject": "Dica n8n",
        "ScheduledType": "DAILY",
        "ScheduledPeriod": 1,
        "ScheduledDay": 1,
        "ScheduledTime": "08:00",
        "Prompt": "Dicas n8n"
      }
    ];

    // ========================================
    // EDITE AQUI: Histórico de execuções
    // ========================================
    const executions = [
    ];

    // ========================================
    // EDITE AQUI: Emails por task
    // ========================================
    const emails = [
      { Id: 1, email: 'ldias.rs@gmail.com' },
      { Id: 2, email: 'ldias4@gmail.com' },
      { Id: 3, email: 'ldias.rs@gmail.com' },
      { Id: 4, email: 'ldias.rs@gmail.com' },
      { Id: 5, email: 'ldias.rs@gmail.com' },
      { Id: 6, email: 'ldias4@gmail.com' },
    ];

    // ========================================
    // EDITE AQUI: Data/hora do teste
    // ========================================
    // Formato: new Date(ano, mês-1, dia, hora, minuto)
    // Exemplo: new Date(2025, 10, 10, 17, 0) = 10/11/2025 às 17:00
    const today = new Date(2025, 10, 13, 9, 0); // Segunda-feira, 10/11/2025 às 17:00

    // ========================================
    // Executar filtro
    // ========================================
    const result = filterTasksToExecute(tasks, executions, emails, today);

    // ========================================
    // Resultados
    // ========================================
    console.log('\n📋 RESULTADO DO TESTE:');
    console.log(`Total de tasks para executar: ${result.length}`);
    
    const report =result.map(task => {
      return `\n✅ Task ID ${task.Id}: ${task.Subject} - Emails: ${task.Emails.join(', ')}`
    });

    console.log(report);
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
