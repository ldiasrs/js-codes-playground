/**
 * Wrapper para n8n - Importa e executa a lógica principal
 * 
 * Este código deve ser colado no nodo Code do n8n após sincronizar.
 * Para desenvolvimento local, você pode usar require().
 */

const { filterTasksToExecute } = require('./index');

/**
 * Função wrapper que o n8n executará
 * No n8n, este código é executado diretamente
 */
function executeN8nNode() {
  // Acessar nodes usando $() syntax
  const tasksItems = $('GetTasks').all();
  const executionsItems = $('GetExecutions').all();

  // Extrair dados JSON
  const tasks = tasksItems.map(item => item.json);
  const executions = executionsItems.map(item => item.json);

  // Processar usando a lógica principal
  const tasksWithHistory = filterTasksToExecute(tasks, executions);

  // Retornar no formato n8n
  return tasksWithHistory.map((task, index) => ({
    json: task,
    pairedItem: { item: index }
  }));
}

// Exportar para testes (opcional)
module.exports = {
  executeN8nNode
};

