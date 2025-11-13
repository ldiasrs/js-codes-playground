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
  const splitItems = [];
  
  tasks.forEach(task => {
    const emails = task.Emails || [];
    
    if (emails.length === 0) {
      console.log(`⚠️ Task "${task.Subject}" has no emails`);
      return;
    }
    
    // Para cada email, criar um item separado
    emails.forEach(email => {
      splitItems.push({
        ...task,
        currentEmail: email,
        allEmails: emails.join(', ')
      });
    });
    
    console.log(`📧 Task "${task.Subject}" split into ${emails.length} email(s)`);
  });
  
  console.log(`✅ Total items to send: ${splitItems.length}`);
  
  return splitItems;
}
  

// Exportar função para testes
module.exports = {
  splitByEmails
};

