/**
 * SplitByEmails - Core Logic
 * Divide tasks por seus emails para envio individual
 * 
 * @version 1.0.0
 */

/**
 * Divide tasks em múltiplos itens, um para cada email
 * Assume que tasks já foram validadas pelo FilterTasksToBeExecuted
 * @param {Array} tasks - Lista de tasks com Emails
 * @returns {Array}
 */
function splitByEmails(tasks) {
  console.log(tasks)
  const splitItems = [];
  
  tasks.map(task => {

    const emails = task.Emails || [];
    
    // Para cada email, criar um item separado
    emails.map(email => {
      splitItems.push({
        ...task,
        currentEmail: email,
        allEmails: emails.join(', ')
      });
    });
  });
  
  return splitItems;
}
  

// Exportar função para testes
module.exports = {
  splitByEmails
};

