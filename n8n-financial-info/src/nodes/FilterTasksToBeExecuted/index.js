/**
 * FilterTasksToBeExecuted - Core Logic
 * Task scheduler com histórico de execuções
 * 
 * @version 1.0.0
 */

const ScheduleType = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MOUNTHLY'
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

/**
 * Parseia data do formato DD/MM/YYYY HH:MM:SS
 * @param {string} dateStr - String de data
 * @returns {Date} - Objeto Date
 */
function parseExecutionDate(dateStr) {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Verifica se uma data é hoje
 * @param {Date} date - Data para verificar
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function isToday(date, today = new Date()) {
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Obtém a última execução de uma task
 * @param {number} taskId - ID da task
 * @param {Array} executions - Lista de execuções
 * @returns {Date|null}
 */
function getLastExecution(taskId, executions) {
  const taskExecutions = executions
    .filter(exec => exec.Id === taskId)
    .map(exec => parseExecutionDate(exec.ExecutionTime))
    .sort((a, b) => b - a);
  
  return taskExecutions.length > 0 ? taskExecutions[0] : null;
}

/**
 * Obtém as últimas N execuções de uma task
 * @param {number} taskId - ID da task
 * @param {Array} executions - Lista de execuções
 * @param {number} n - Número de execuções
 * @returns {Array}
 */
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

/**
 * Verifica se o horário agendado já passou
 * @param {string} scheduledTime - Horário no formato "HH:mm"
 * @param {Date} currentTime - Data/hora atual
 * @returns {boolean}
 */
function hasScheduledTimePassed(scheduledTime, currentTime) {
  if (!scheduledTime) return true; // Se não tem horário definido, sempre pode executar
  
  const [scheduledHours, scheduledMinutes] = scheduledTime.split(':').map(Number);
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  
  // Compara horário
  if (currentHours > scheduledHours) return true;
  if (currentHours === scheduledHours && currentMinutes >= scheduledMinutes) return true;
  
  return false;
}

/**
 * Verifica se uma task DAILY deve ser executada
 * @param {Object} task - Task
 * @param {Date} lastExecution - Última execução
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function shouldExecuteDaily(task, lastExecution, today) {
  if (!lastExecution) return true;
  
  // Se já executou hoje, não executar
  if (isToday(lastExecution, today)) return false;
  
  // Se tem período maior que 1, verificar se passou o número de dias
  if (task.ScheduledPeriod > 1) {
    const daysDiff = Math.floor((today - lastExecution) / (1000 * 60 * 60 * 24));
    return daysDiff >= task.ScheduledPeriod;
  }
  
  // Período = 1, executar diariamente
  return true;
}

/**
 * Verifica se uma task WEEKLY deve ser executada
 * @param {Object} task - Task
 * @param {Date} lastExecution - Última execução
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function shouldExecuteWeekly(task, lastExecution, today) {
  const scheduledDayOfWeek = DaysOfWeek[task.ScheduledDay];
  const todayDayOfWeek = today.getDay();
  
  // Não é o dia da semana correto
  if (scheduledDayOfWeek !== todayDayOfWeek) return false;
  
  // Verifica se o horário já passou
  if (!hasScheduledTimePassed(task.ScheduledTime, today)) return false;
  
  // Nunca executou antes - pode executar
  if (!lastExecution) return true;
  
  // Já executou hoje - não executar novamente
  if (isToday(lastExecution, today)) return false;
  
  // Executou em outro dia - verifica o período
  const weeksDiff = Math.floor((today - lastExecution) / (1000 * 60 * 60 * 24 * 7));
  return weeksDiff >= task.ScheduledPeriod;
}

/**
 * Verifica se uma task MONTHLY deve ser executada
 * @param {Object} task - Task
 * @param {Date} lastExecution - Última execução
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function shouldExecuteMonthly(task, lastExecution, today) {
  const scheduledDayOfMonth = parseInt(task.ScheduledDay);
  const todayDayOfMonth = today.getDate();
  
  // Não é o dia do mês correto
  if (scheduledDayOfMonth !== todayDayOfMonth) return false;
  
  // Verifica se o horário já passou
  if (!hasScheduledTimePassed(task.ScheduledTime, today)) return false;
  
  // Nunca executou antes - pode executar
  if (!lastExecution) return true;
  
  // Já executou hoje - não executar novamente
  if (isToday(lastExecution, today)) return false;
  
  // Executou em outro dia - verifica o período
  const monthsDiff = (today.getFullYear() - lastExecution.getFullYear()) * 12 
                   + (today.getMonth() - lastExecution.getMonth());
  return monthsDiff >= task.ScheduledPeriod;
}

/**
 * Verifica se uma task deve ser executada
 * @param {Object} task - Task
 * @param {Date} lastExecution - Última execução
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function shouldExecuteTask(task, lastExecution, today = new Date()) {
  switch (task.ScheduledType) {
    case ScheduleType.DAILY:
      return shouldExecuteDaily(task, lastExecution, today);
    case ScheduleType.WEEKLY:
      return shouldExecuteWeekly(task, lastExecution, today);
    case ScheduleType.MONTHLY:
      return shouldExecuteMonthly(task, lastExecution, today);
    default:
      return false;
  }
}

/**
 * Constrói prompt enriquecido com histórico
 * @param {Object} task - Task
 * @param {Array} lastExecutions - Últimas execuções
 * @returns {string}
 */
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

/**
 * Função principal que processa tasks e execuções
 * @param {Array} tasks - Lista de tasks
 * @param {Array} executions - Lista de execuções
 * @param {Array} emails - Lista de emails por task ID (opcional)
 * @param {Date} today - Data de hoje
 * @returns {Array}
 */
function filterTasksToExecute(tasks, executions, emails = [], today = new Date()) {
  console.log(`📅 Verificando tasks para: ${today.toLocaleDateString('pt-BR')}`);
  console.log(`📊 Total de tasks: ${tasks.length}`);
  console.log(`📊 Total de execuções: ${executions.length}`);
  console.log(`📧 Total de emails configurados: ${emails.length}`);

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

  // Enriquecer cada task com histórico das últimas 3 execuções e emails
  const tasksWithHistory = tasksToExecute.map(task => {
    const lastExecutions = getLastNExecutions(task.Id, executions, 3);
    const enrichedPrompt = buildPromptWithHistory(task, lastExecutions);
    
    // Get emails for this task
    const taskEmails = emails
      .filter(e => e.Id === task.Id)
      .map(e => e.email);
    
    console.log(`\n📝 Task "${task.Subject}" - Histórico: ${lastExecutions.length} execuções anteriores`);
    console.log(`📧 Emails: ${taskEmails.length > 0 ? taskEmails.join(', ') : 'nenhum'}`);
    
    return {
      ...task,
      Prompt: enrichedPrompt,
      HistoryCount: lastExecutions.length,
      Emails: taskEmails
    };
  });

  return tasksWithHistory;
}

// Exportar todas as funções para testes
module.exports = {
  ScheduleType,
  DaysOfWeek,
  parseExecutionDate,
  isToday,
  getLastExecution,
  getLastNExecutions,
  hasScheduledTimePassed,
  shouldExecuteDaily,
  shouldExecuteWeekly,
  shouldExecuteMonthly,
  shouldExecuteTask,
  buildPromptWithHistory,
  filterTasksToExecute
};

