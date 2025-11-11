#!/usr/bin/env node
/**
 * Script para sincronizar código dos arquivos src/ para o workflow n8n
 * 
 * Usage: npm run sync-nodes
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '../flows/task-flow.json');

// Configuração de nodes a sincronizar
const NODES_CONFIG = [
  {
    name: 'FilterTasksToBeExecuted',
    indexPath: path.join(__dirname, '../src/nodes/FilterTasksToBeExecuted/index.js'),
    wrapperPath: path.join(__dirname, '../src/nodes/FilterTasksToBeExecuted/n8n-wrapper.js')
  },
  {
    name: 'SplitByEmails',
    indexPath: path.join(__dirname, '../src/nodes/SplitByEmails/index.js'),
    wrapperPath: path.join(__dirname, '../src/nodes/SplitByEmails/n8n-wrapper.js')
  }
];

console.log('🔄 Sincronizando código dos nodes com workflow...\n');

/**
 * Processa o código do wrapper removendo partes específicas do Node.js
 * @param {string} wrapperCode - Código do wrapper
 * @returns {string}
 */
function processWrapperCode(wrapperCode) {
  return wrapperCode
    .replace(/\/\*\*[\s\S]*?\*\//g, '') // Remove JSDoc
    .replace(/\/\/[^\n]*/g, '') // Remove comentários inline
    .replace(/const\s*\{[^}]+\}\s*=\s*require\([^)]+\);?\s*/g, '') // Remove require
    .replace(/module\.exports\s*=\s*\{[\s\S]*$/m, '') // Remove exports até o final
    .replace(/function\s+executeN8nNode\(\)\s*\{/, '') // Remove function declaration
    .replace(/\}\s*$/, '') // Remove último closing brace
    .trim();
}

/**
 * Sincroniza um node específico
 * @param {Object} nodeConfig - Configuração do node
 * @param {Object} workflow - Workflow JSON
 * @returns {boolean} - Sucesso ou falha
 */
function syncNode(nodeConfig, workflow) {
  const { name, indexPath, wrapperPath } = nodeConfig;
  
  console.log(`\n📦 Sincronizando node: ${name}`);
  
  // Verificar se arquivos existem
  if (!fs.existsSync(indexPath)) {
    console.error(`   ❌ Arquivo não encontrado: ${indexPath}`);
    return false;
  }
  
  if (!fs.existsSync(wrapperPath)) {
    console.error(`   ❌ Arquivo não encontrado: ${wrapperPath}`);
    return false;
  }
  
  // Ler código do módulo
  const nodeCode = fs.readFileSync(indexPath, 'utf8');
  
  // Ler código do wrapper
  const wrapperCode = fs.readFileSync(wrapperPath, 'utf8');
  
  // Encontrar nodo no workflow
  const nodeIndex = workflow.nodes.findIndex(node => node.name === name);
  
  if (nodeIndex === -1) {
    console.error(`   ❌ Nodo ${name} não encontrado no workflow!`);
    return false;
  }
  
  // Preparar código para n8n
  // 1. Remover comentários JSDoc (mantém comentários inline)
  let n8nCode = nodeCode.replace(/\/\*\*[\s\S]*?\*\//g, '');
  
  // 2. Remover exports do module.exports
  n8nCode = n8nCode.replace(/module\.exports\s*=\s*\{[\s\S]*?\};?\s*$/m, '');
  
  // 3. Limpar espaços extras
  n8nCode = n8nCode.trim();
  
  // 4. Processar wrapper
  const n8nWrapper = processWrapperCode(wrapperCode);
  
  const finalCode = n8nCode + '\n\n' + n8nWrapper;
  
  // Atualizar workflow
  workflow.nodes[nodeIndex].parameters.jsCode = finalCode;
  
  console.log(`   ✅ Sincronizado com sucesso!`);
  console.log(`   📦 Fonte: ${path.basename(indexPath)}`);
  console.log(`   🔌 Wrapper: ${path.basename(wrapperPath)}`);
  console.log(`   📊 Tamanho: ${finalCode.length} caracteres`);
  console.log(`   📄 Linhas: ${finalCode.split('\n').length}`);
  
  return true;
}

// Verificar se workflow existe
if (!fs.existsSync(WORKFLOW_PATH)) {
  console.error(`❌ Arquivo não encontrado: ${WORKFLOW_PATH}`);
  process.exit(1);
}

try {
  // Ler workflow
  const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
  
  // Criar backup do workflow original
  const backupPath = WORKFLOW_PATH + '.backup';
  fs.copyFileSync(WORKFLOW_PATH, backupPath);
  console.log(`💾 Backup criado: ${path.basename(backupPath)}`);
  
  // Sincronizar cada node
  let successCount = 0;
  let failCount = 0;
  
  for (const nodeConfig of NODES_CONFIG) {
    const success = syncNode(nodeConfig, workflow);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Salvar workflow atualizado
  fs.writeFileSync(WORKFLOW_PATH, JSON.stringify(workflow, null, 2));
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Sincronização concluída!`);
  console.log(`   📊 ${successCount} node(s) sincronizado(s)`);
  if (failCount > 0) {
    console.log(`   ⚠️  ${failCount} node(s) com erro`);
  }
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Importe o arquivo flows/task-flow.json no n8n');
  console.log('   2. Teste o workflow');
  console.log('   3. Se houver problemas, restaure do backup\n');
  
  if (failCount > 0) {
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Erro ao sincronizar:', error.message);
  console.error(error.stack);
  process.exit(1);
}

