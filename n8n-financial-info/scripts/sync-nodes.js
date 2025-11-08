#!/usr/bin/env node
/**
 * Script para sincronizar código dos arquivos src/ para o workflow n8n
 * 
 * Usage: npm run sync-nodes
 */

const fs = require('fs');
const path = require('path');

const NODE_PATH = path.join(__dirname, '../src/nodes/FilterTasksToBeExecuted/index.js');
const WORKFLOW_PATH = path.join(__dirname, '../flows/task-flow.json');

console.log('🔄 Sincronizando código do nodo com workflow...\n');

// Verificar se arquivos existem
if (!fs.existsSync(NODE_PATH)) {
  console.error(`❌ Arquivo não encontrado: ${NODE_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(WORKFLOW_PATH)) {
  console.error(`❌ Arquivo não encontrado: ${WORKFLOW_PATH}`);
  process.exit(1);
}

try {
  // Ler código do módulo
  const nodeCode = fs.readFileSync(NODE_PATH, 'utf8');

  // Ler workflow
  const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));

  // Encontrar nodo FilterTasksToBeExecuted
  const nodeIndex = workflow.nodes.findIndex(
    node => node.name === 'FilterTasksToBeExecuted'
  );

  if (nodeIndex === -1) {
    console.error('❌ Nodo FilterTasksToBeExecuted não encontrado no workflow!');
    process.exit(1);
  }

  // Preparar código para n8n
  // 1. Remover comentários JSDoc (mantém comentários inline)
  let n8nCode = nodeCode.replace(/\/\*\*[\s\S]*?\*\//g, '');
  
  // 2. Remover exports do module.exports
  n8nCode = n8nCode.replace(/module\.exports\s*=\s*\{[\s\S]*?\};?\s*$/m, '');
  
  // 3. Limpar espaços extras
  n8nCode = n8nCode.trim();

  // 4. Adicionar wrapper n8n
  const n8nWrapper = `
// Wrapper n8n - Executar lógica
const tasksItems = $('GetTasks').all();
const executionsItems = $('GetExecutions').all();
const tasks = tasksItems.map(item => item.json);
const executions = executionsItems.map(item => item.json);
const tasksWithHistory = filterTasksToExecute(tasks, executions);
return tasksWithHistory.map((task, index) => ({
  json: task,
  pairedItem: { item: index }
}));`;

  const finalCode = n8nCode + '\n' + n8nWrapper;

  // Atualizar workflow
  workflow.nodes[nodeIndex].parameters.jsCode = finalCode;

  // Criar backup do workflow original
  const backupPath = WORKFLOW_PATH + '.backup';
  fs.copyFileSync(WORKFLOW_PATH, backupPath);
  console.log(`💾 Backup criado: ${path.basename(backupPath)}`);

  // Salvar workflow atualizado
  fs.writeFileSync(WORKFLOW_PATH, JSON.stringify(workflow, null, 2));

  console.log('✅ Código sincronizado com sucesso!');
  console.log(`📝 Nodo: ${workflow.nodes[nodeIndex].name}`);
  console.log(`📊 Tamanho do código: ${finalCode.length} caracteres`);
  console.log(`📄 Linhas: ${finalCode.split('\n').length}`);
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Importe o arquivo flows/task-flow.json no n8n');
  console.log('   2. Teste o workflow');
  console.log('   3. Se houver problemas, restaure do backup\n');

} catch (error) {
  console.error('❌ Erro ao sincronizar:', error.message);
  console.error(error.stack);
  process.exit(1);
}

