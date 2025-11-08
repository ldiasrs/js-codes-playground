/**
 * Testes manuais para o Task Scheduler
 * Execute: node task-scheduler.test.js
 */

const {
  getTasksToExecuteToday,
  parseExecutionDate,
  isToday,
  getLastExecution
} = require('./task-scheduler.js');

// Dados de exemplo
const tasks = [
  {
    "row_number": 2,
    "Id": 1,
    "Subject": "Jantas da Semana",
    "ScheduledType": "DAILY",
    "ScheduledPeriod": 1,
    "ScheduledDay": "",
    "ScheduledTime": "13:00",
    "Prompt": "Me de 5 ideias de jantas"
  },
  {
    "row_number": 3,
    "Id": 2,
    "Subject": "Estoicismo Semanal",
    "ScheduledType": "WEEKLLY",
    "ScheduledPeriod": 1,
    "ScheduledDay": "Monday",
    "ScheduledTime": "08:00",
    "Prompt": "5 Dicas de estoicismo"
  },
  {
    "row_number": 4,
    "Id": 3,
    "Subject": "Dicas de Livros",
    "ScheduledType": "MONTLY",
    "ScheduledPeriod": 1,
    "ScheduledDay": 1,
    "ScheduledTime": "08:00",
    "Prompt": "3 dias de livros inspiradores"
  }
];

const executions = [
  {
    "row_number": 2,
    "Id": 1,
    "ExecutionTime": "01/11/2025 10:00:00",
    "Saida": "Essa é uma saida de janta"
  },
  {
    "row_number": 3,
    "Id": 2,
    "ExecutionTime": "03/11/2025 08:00:00",
    "Saida": "Dicas de estoicismo"
  }
];

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 TESTES DO TASK SCHEDULER');
console.log('═══════════════════════════════════════════════════════\n');

// Teste 1: Verificar tasks para hoje
console.log('📅 Teste 1: Tasks para HOJE');
console.log('Data de teste:', new Date().toLocaleDateString('pt-BR'));
console.log('───────────────────────────────────────────────────────');
const tasksForToday = getTasksToExecuteToday(tasks, executions);
console.log('\n📊 Resultado:');
console.log(`Total de tasks: ${tasks.length}`);
console.log(`Tasks para executar hoje: ${tasksForToday.length}\n`);

if (tasksForToday.length > 0) {
  console.log('✅ Tasks que devem ser executadas:\n');
  tasksForToday.forEach((task, i) => {
    console.log(`${i + 1}. ${task.Subject}`);
    console.log(`   - Tipo: ${task.ScheduledType}`);
    console.log(`   - Horário: ${task.ScheduledTime}`);
    console.log(`   - Prompt: ${task.Prompt}\n`);
  });
} else {
  console.log('⏭️  Nenhuma task precisa ser executada hoje.\n');
}

// Teste 2: Simular data específica (segunda-feira)
console.log('\n═══════════════════════════════════════════════════════');
console.log('📅 Teste 2: Simular SEGUNDA-FEIRA (11/11/2025)');
console.log('───────────────────────────────────────────────────────');
const testDateMonday = new Date(2025, 10, 10); // 10/11/2025 é segunda
console.log('Data simulada:', testDateMonday.toLocaleDateString('pt-BR'));
const tasksForMonday = getTasksToExecuteToday(tasks, [], testDateMonday);
console.log(`\n✅ Tasks para executar: ${tasksForMonday.length}\n`);
tasksForMonday.forEach(task => {
  console.log(`- ${task.Subject} (${task.ScheduledType})`);
});

// Teste 3: Simular primeiro dia do mês
console.log('\n═══════════════════════════════════════════════════════');
console.log('📅 Teste 3: Simular DIA 1 DO MÊS (01/12/2025)');
console.log('───────────────────────────────────────────────────────');
const testDateFirstDay = new Date(2025, 11, 1); // 01/12/2025
console.log('Data simulada:', testDateFirstDay.toLocaleDateString('pt-BR'));
const tasksForFirstDay = getTasksToExecuteToday(tasks, [], testDateFirstDay);
console.log(`\n✅ Tasks para executar: ${tasksForFirstDay.length}\n`);
tasksForFirstDay.forEach(task => {
  console.log(`- ${task.Subject} (${task.ScheduledType})`);
});

// Teste 4: Verificar parseamento de datas
console.log('\n═══════════════════════════════════════════════════════');
console.log('📅 Teste 4: Parseamento de Datas');
console.log('───────────────────────────────────────────────────────');
const testDateStr = "01/11/2025 10:00:00";
const parsedDate = parseExecutionDate(testDateStr);
console.log(`String original: ${testDateStr}`);
console.log(`Data parseada: ${parsedDate.toLocaleString('pt-BR')}`);
console.log(`É hoje? ${isToday(parsedDate)}`);

// Teste 5: Verificar última execução
console.log('\n═══════════════════════════════════════════════════════');
console.log('📅 Teste 5: Última Execução de Cada Task');
console.log('───────────────────────────────────────────────────────');
tasks.forEach(task => {
  const lastExec = getLastExecution(task.Id, executions);
  console.log(`\nTask: ${task.Subject} (ID: ${task.Id})`);
  if (lastExec) {
    console.log(`  Última execução: ${lastExec.toLocaleString('pt-BR')}`);
  } else {
    console.log(`  Nunca foi executada`);
  }
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ TESTES CONCLUÍDOS');
console.log('═══════════════════════════════════════════════════════\n');

