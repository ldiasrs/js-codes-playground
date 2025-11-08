/**
 * Código para usar no n8n Code Node
 * 
 * INPUT 1: Lista de Tasks
 * INPUT 2: Lista de Execuções
 * 
 * OUTPUT: Tasks que devem ser executadas hoje
 */

// ============================================
// COPIE TODO O CÓDIGO ABAIXO PARA O N8N
// ============================================

const ScheduleType = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLLY',
  MOUNTHLY: 'MONTLY'
};

const DaysOfWeek = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function parseExecutionDate(dateStr) {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function isToday(date, today = new Date()) {
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function getLastExecution(taskId, executions) {
  const taskExecutions = executions
    .filter(exec => exec.Id === taskId)
    .map(exec => parseExecutionDate(exec.ExecutionTime))
    .sort((a, b) => b - a);
  
  return taskExecutions.length > 0 ? taskExecutions[0] : null;
}

function getLastNExecutions(taskId, executions, n = 3) {
  const taskExecutions = executions
    .filter(exec => exec.Id === taskId)
    .map(exec => ({
      date: parseExecutionDate(exec.ExecutionTime),
      dateStr: exec.ExecutionTime,
      output: exec.Saida
    }))
    .sort((a, b) => b.date - a.date)
    .slice(0, n);
  
  return taskExecutions;
}

function shouldExecuteDaily(task, lastExecution, today) {
  if (!lastExecution) return true;
  if (!isToday(lastExecution, today)) return true;
  
  if (task.ScheduledPeriod > 1) {
    const daysDiff = Math.floor((today - lastExecution) / (1000 * 60 * 60 * 24));
    return daysDiff >= task.ScheduledPeriod;
  }
  
  return false;
}

function shouldExecuteWeekly(task, lastExecution, today) {
  const scheduledDayOfWeek = DaysOfWeek[task.ScheduledDay];
  const todayDayOfWeek = today.getDay();
  
  if (scheduledDayOfWeek !== todayDayOfWeek) return false;
  if (!lastExecution) return true;
  
  if (!isToday(lastExecution, today)) {
    const weeksDiff = Math.floor((today - lastExecution) / (1000 * 60 * 60 * 24 * 7));
    return weeksDiff >= task.ScheduledPeriod;
  }
  
  return false;
}

function shouldExecuteMOUNTHLY(task, lastExecution, today) {
  const scheduledDayOfMonth = parseInt(task.ScheduledDay);
  const todayDayOfMonth = today.getDate();
  
  if (scheduledDayOfMonth !== todayDayOfMonth) return false;
  if (!lastExecution) return true;
  
  if (!isToday(lastExecution, today)) {
    const monthsDiff = (today.getFullYear() - lastExecution.getFullYear()) * 12 
                     + (today.getMonth() - lastExecution.getMonth());
    return monthsDiff >= task.ScheduledPeriod;
  }
  
  return false;
}

function shouldExecuteTask(task, lastExecution, today = new Date()) {
  switch (task.ScheduledType) {
    case ScheduleType.DAILY:
      return shouldExecuteDaily(task, lastExecution, today);
    case ScheduleType.WEEKLY:
      return shouldExecuteWeekly(task, lastExecution, today);
    case ScheduleType.MOUNTHLY:
      return shouldExecuteMOUNTHLY(task, lastExecution, today);
    default:
      return false;
  }
}

function buildPromptWithHistory(task, lastExecutions) {
  let prompt = task.Prompt;
  
  if (lastExecutions.length > 0) {
    prompt += '\n\n---\n\n';
    prompt += '📋 HISTÓRICO DAS ÚLTIMAS EXECUÇÕES:\n';
    prompt += 'Para evitar repetição, considere as respostas anteriores abaixo:\n\n';
    
    lastExecutions.forEach((exec, index) => {
      prompt += `${index + 1}. Execução em ${exec.dateStr}:\n`;
      prompt += `${exec.output}\n\n`;
    });
    
    prompt += '⚠️ IMPORTANTE: Gere uma resposta diferente e criativa, evitando repetir as ideias acima.';
  }
  
  return prompt;
}

// ============================================
// CÓDIGO PRINCIPAL N8N
// ============================================

// Acessar nodes anteriores usando $() syntax
// Nota: GetTasks e GetExecutions devem ter sido executados antes
const tasksItems = $('GetTasks').all();
const executionsItems = $('GetExecutions').all();

// Extrair dados JSON
const tasks = tasksItems.map(item => item.json);
const executions = executionsItems.map(item => item.json);

// Data de hoje
const today = new Date();

console.log(`📅 Verificando tasks para: ${today.toLocaleDateString('pt-BR')}`);
console.log(`📊 Total de tasks: ${tasks.length}`);
console.log(`📊 Total de execuções: ${executions.length}`);

// Filtrar tasks que devem ser executadas hoje
const tasksToExecute = tasks.filter(task => {
  const lastExecution = getLastExecution(task.Id, executions);
  const shouldExecute = shouldExecuteTask(task, lastExecution, today);
  
  if (shouldExecute) {
    console.log(`✅ Task "${task.Subject}" deve ser executada`);
  }
  
  return shouldExecute;
});

console.log(`\n🎯 Total de tasks para executar: ${tasksToExecute.length}`);

// Enriquecer cada task com histórico das últimas 3 execuções
const tasksWithHistory = tasksToExecute.map(task => {
  const lastExecutions = getLastNExecutions(task.Id, executions, 3);
  const enrichedPrompt = buildPromptWithHistory(task, lastExecutions);
  
  console.log(`\n📝 Task "${task.Subject}" - Histórico: ${lastExecutions.length} execuções anteriores`);
  
  return {
    ...task,
    Prompt: enrichedPrompt,
    HistoryCount: lastExecutions.length
  };
});

// Retornar no formato n8n
return tasksWithHistory.map((task, index) => ({
  json: task,
  pairedItem: { item: index }
}));

