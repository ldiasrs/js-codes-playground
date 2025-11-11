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

 // Get AI output and task data
 const items = $('FilterTasksToBeExecuted');
  
 // Extrair tasks dos items
 const tasks = items.all().map(item => item.json)

 console.log('task', tasks)
 
 // Dividir tasks por emails
 const splitItems = splitByEmails(tasks);
 
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

