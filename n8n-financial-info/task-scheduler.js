/**
 * Task Scheduler - Verifica quais tasks devem ser executadas hoje
 * 
 * @module task-scheduler
 */

/**
 * Tipos de agendamento suportados
 */
const ScheduleType = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLLY', // Mantido o typo para compatibilidade
  MONTHLY: 'MONTLY'  // Mantido o typo para compatibilidade
};

/**
 * Dias da semana
 */
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
 * @param {Date} today - Data de hoje (opcional, para testes)
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
 * @returns {Date|null} - Data da última execução ou null
 */
function getLastExecution(taskId, executions) {
  const taskExecutions = executions
    .filter(exec => exec.Id === taskId)
    .map(exec => parseExecutionDate(exec.ExecutionTime))
    .sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
  
  return taskExecutions.length > 0 ? taskExecutions[0] : null;
}

/**
 * Verifica se uma task DAILY deve ser executada
 * @param {Object} task - Task
 * @param {Date} lastExecution - Última execução
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function shouldExecuteDaily(task, lastExecution, today) {
  // Se nunca executou, deve executar
  if (!lastExecution) return true;
  
  // Se a última execução não foi hoje, deve executar
  if (!isToday(lastExecution, today)) return true;
  
  // Se o período é maior que 1, verificar se passou o número de dias
  if (task.ScheduledPeriod > 1) {
    const daysDiff = Math.floor((today - lastExecution) / (1000 * 60 * 60 * 24));
    return daysDiff >= task.ScheduledPeriod;
  }
  
  return false;
}

/**
 * Verifica se uma task WEEKLY deve ser executada
 * @param {Object} task - Task
 * @param {Date} lastExecution - Última execução
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function shouldExecuteWeekly(task, lastExecution, today) {
  // Verificar se hoje é o dia da semana configurado
  const scheduledDayOfWeek = DaysOfWeek[task.ScheduledDay];
  const todayDayOfWeek = today.getDay();
  
  if (scheduledDayOfWeek !== todayDayOfWeek) {
    return false;
  }
  
  // Se nunca executou, deve executar
  if (!lastExecution) return true;
  
  // Se a última execução não foi hoje, deve executar
  if (!isToday(lastExecution, today)) {
    // Verificar se passou o número de semanas
    const weeksDiff = Math.floor((today - lastExecution) / (1000 * 60 * 60 * 24 * 7));
    return weeksDiff >= task.ScheduledPeriod;
  }
  
  return false;
}

/**
 * Verifica se uma task MONTHLY deve ser executada
 * @param {Object} task - Task
 * @param {Date} lastExecution - Última execução
 * @param {Date} today - Data de hoje
 * @returns {boolean}
 */
function shouldExecuteMonthly(task, lastExecution, today) {
  // Verificar se hoje é o dia do mês configurado
  const scheduledDayOfMonth = parseInt(task.ScheduledDay);
  const todayDayOfMonth = today.getDate();
  
  if (scheduledDayOfMonth !== todayDayOfMonth) {
    return false;
  }
  
  // Se nunca executou, deve executar
  if (!lastExecution) return true;
  
  // Se a última execução não foi hoje, deve executar
  if (!isToday(lastExecution, today)) {
    // Verificar se passou o número de meses
    const monthsDiff = (today.getFullYear() - lastExecution.getFullYear()) * 12 
                     + (today.getMonth() - lastExecution.getMonth());
    return monthsDiff >= task.ScheduledPeriod;
  }
  
  return false;
}

/**
 * Verifica se uma task deve ser executada hoje
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
      console.warn(`Tipo de agendamento desconhecido: ${task.ScheduledType}`);
      return false;
  }
}

/**
 * Filtra tasks que devem ser executadas hoje
 * @param {Array} tasks - Lista de tasks
 * @param {Array} executions - Lista de execuções
 * @param {Date} today - Data de hoje (opcional, para testes)
 * @returns {Array} - Tasks que devem ser executadas
 */
function getTasksToExecuteToday(tasks, executions, today = new Date()) {
  return tasks.filter(task => {
    const lastExecution = getLastExecution(task.Id, executions);
    const shouldExecute = shouldExecuteTask(task, lastExecution, today);
    
    if (shouldExecute) {
      console.log(`✅ Task "${task.Subject}" (ID: ${task.Id}) deve ser executada`);
    } else {
      console.log(`⏭️  Task "${task.Subject}" (ID: ${task.Id}) não precisa ser executada hoje`);
    }
    
    return shouldExecute;
  });
}

/**
 * Função principal para uso no n8n
 * @param {Array} tasks - Lista de tasks do input 1
 * @param {Array} executions - Lista de execuções do input 2
 * @returns {Array} - Tasks formatadas para n8n
 */
function filterTasksForN8n(tasks, executions) {
  const tasksToExecute = getTasksToExecuteToday(tasks, executions);
  
  // Retornar no formato n8n
  return tasksToExecute.map((task, index) => ({
    json: task,
    pairedItem: { item: index }
  }));
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getTasksToExecuteToday,
    filterTasksForN8n,
    parseExecutionDate,
    isToday,
    getLastExecution,
    shouldExecuteTask,
    ScheduleType,
    DaysOfWeek
  };
}

