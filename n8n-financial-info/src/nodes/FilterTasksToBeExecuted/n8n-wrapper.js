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
  const emailsItems = $('GetEmails').all();

  // Extrair dados JSON
  const tasks = tasksItems.map(item => item.json);
  const executions = executionsItems.map(item => item.json);
  const emails = emailsItems.map(item => item.json);

  // Processar usando a lógica principal
  const tasksWithHistory = filterTasksToExecute(tasks, executions, emails);

  // Filtrar apenas tasks que tenham emails configurados
  const tasksWithEmails = tasksWithHistory.filter(task => {
    if (!task.Emails || task.Emails.length === 0) {
      console.log(`⚠️ Task "${task.Subject}" (ID: ${task.Id}) ignorada - sem emails configurados`);
      return false;
    }
    return true;
  });

  // Se não houver tasks com emails, retornar vazio para terminar o fluxo
  if (tasksWithEmails.length === 0) {
    console.log('\n❌ Nenhuma task com emails configurados. Finalizando fluxo.');
    return [];
  }

  console.log(`\n✅ ${tasksWithEmails.length} task(s) com emails serão processadas`);

  // Retornar no formato n8n
  return tasksWithEmails.map((task, index) => ({
    json: task,
    pairedItem: { item: index }
  }));
}

// Exportar para testes (opcional)
module.exports = {
  executeN8nNode
};

