/**
 * Wrapper para n8n - Importa e executa a lógica principal
 * 
 * Este código deve ser colado no nodo Code do n8n após sincronizar.
 * Para desenvolvimento local, você pode usar require().
 */

const { splitByEmails } = require('./index');

/**
 * Função wrapper que o n8n executará
 * No n8n, este código é executado diretamente
 */
function executeN8nNode() {
  // Get AI output from current input (comes from AI-Process node)
  const aiOutputs = $input.all();
  
  // Get original task data from FilterTasksToBeExecuted
  const originalTasks = $('FilterTasksToBeExecuted').all();
  
  // Merge AI output with original task data
  const mergedItems = aiOutputs.map((aiItem, index) => {
    // Get corresponding original task using index
    const originalTask = originalTasks[index]?.json || {};
    
    // Merge AI output with original task properties
    return {
      ...originalTask,
      content: aiItem.json.content
    };
  });
  
  console.log(`📥 Merged ${mergedItems.length} AI outputs with original tasks`);
  
  // Dividir tasks por emails
  const splitItems = splitByEmails(mergedItems);
  
  // Retornar no formato n8n
  return splitItems.map((item, index) => ({
    json: item,
    pairedItem: { item: index }
  }));
}

// Exportar para testes (opcional)
module.exports = {
  executeN8nNode
};

