/**
 * SplitByEmails - Core Logic
 * Divide tasks por seus emails para envio individual
 * 
 * @version 1.0.0
 */

/**
 * Cria uma cópia da task para cada email
 * @param {Object} task - Task original
 * @param {string} email - Email atual
 * @param {Array<string>} allEmails - Todos os emails da task
 * @returns {Object}
 */
function createTaskForEmail(task, email, allEmails) {
  return {
    ...task,
    currentEmail: email,
    allEmails: allEmails.join(', ')
  };
}

/**
 * Verifica se a task tem emails configurados
 * @param {Object} task - Task a verificar
 * @returns {boolean}
 */
function hasEmails(task) {
  const emails = task.Emails || [];
  return emails.length > 0;
}

/**
 * Divide uma task em múltiplos itens, um para cada email
 * @param {Object} task - Task a dividir
 * @returns {Array<Object>}
 */
function splitTaskByEmails(task) {
  const emails = task.Emails || [];
  
  if (!hasEmails(task)) {
    console.log(`⚠️ Task "${task.Subject}" (ID: ${task.Id}) não tem emails configurados`);
    return [];
  }
  
  const splitItems = emails.map(email => 
    createTaskForEmail(task, email, emails)
  );
  
  console.log(`📧 Task "${task.Subject}" dividida para ${emails.length} email(s)`);
  
  return splitItems;
}

/**
 * Função principal que divide múltiplas tasks por seus emails
 * @param {Array} tasks - Lista de tasks
 * @returns {Array}
 */
function splitByEmails(tasks) {
  const splitItems = [];
  
  tasks.forEach(task => {
    const taskSplitItems = splitTaskByEmails(task);
    splitItems.push(...taskSplitItems);
  });
  
  console.log(`\n✅ Total de emails a enviar: ${splitItems.length}`);
  
  return splitItems;
}

// Exportar todas as funções para testes
module.exports = {
  createTaskForEmail,
  hasEmails,
  splitTaskByEmails,
  splitByEmails
};

