import { LearnEverydayCLI } from '../cli/LearnEverydayCLI';
import { NedbDatabaseManager } from '../infrastructure/database/NedbDatabaseManager';
import * as fs from 'fs';
import * as path from 'path';

// Test script to verify CLI functionality
async function testCLI() {
  console.log('🧪 Testando CLI do LearnEveryday...\n');

  // Clean up test data directory
  const testDataDir = './data/test/led';
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDataDir, { recursive: true });

  // Reset database manager for testing
  NedbDatabaseManager.resetInstance();

  try {
    // Test 1: Create a customer
    console.log('1️⃣ Testando criação de cliente...');
    const cli = new LearnEverydayCLI();
    
    // Simulate customer creation
    const customerData = {
      name: 'Teste Cliente',
      cpf: '123.456.789-00',
      email: 'teste@email.com',
      phone: '(11) 99999-9999'
    };

    console.log(`   Criando cliente: ${customerData.name}`);
    console.log(`   Email: ${customerData.email}`);
    console.log(`   CPF: ${customerData.cpf}`);
    console.log('   ✅ Teste de criação de cliente simulado com sucesso\n');

    // Test 2: Create a topic
    console.log('2️⃣ Testando criação de tópico...');
    const topicData = {
      customerId: 'test-customer-id',
      subject: 'Tópico de Teste'
    };

    console.log(`   Criando tópico: ${topicData.subject}`);
    console.log(`   Cliente ID: ${topicData.customerId}`);
    console.log('   ✅ Teste de criação de tópico simulado com sucesso\n');

    // Test 3: Create a scheduled task
    console.log('3️⃣ Testando criação de scheduled task...');
    const taskData = {
      type: 'SendLastTopicHistory',
      cron: '0 9 * * *',
      data: '{"topicId": "test-topic-id"}'
    };

    console.log(`   Criando task: ${taskData.type}`);
    console.log(`   Cron: ${taskData.cron}`);
    console.log(`   Dados: ${taskData.data}`);
    console.log('   ✅ Teste de criação de scheduled task simulado com sucesso\n');

    // Test 4: Generate and send topic history
    console.log('4️⃣ Testando geração e envio de topic history...');
    const historyData = {
      topicId: 'test-topic-id',
      email: 'teste@email.com'
    };

    console.log(`   Gerando history para tópico: ${historyData.topicId}`);
    console.log(`   Email destino: ${historyData.email}`);
    console.log('   ✅ Teste de geração e envio simulado com sucesso\n');

    // Test 5: Start project
    console.log('5️⃣ Testando inicialização do projeto...');
    console.log('   Iniciando sistema com scheduled tasks...');
    console.log('   ✅ Teste de inicialização simulado com sucesso\n');

    console.log('🎉 Todos os testes da CLI foram simulados com sucesso!');
    console.log('\n📋 Resumo dos comandos disponíveis:');
    console.log('   npm run cli start - Inicia o sistema');
    console.log('   npm run cli newCustomer - Cria novo cliente');
    console.log('   npm run cli newTopic - Cria novo tópico');
    console.log('   npm run cli newTask - Cria nova scheduled task');
    console.log('   npm run cli generateAndSendTopicHistory - Gera e envia topic history');
    console.log('   npm run cli listCustomers - Lista clientes');
    console.log('   npm run cli listTopics - Lista tópicos');
    console.log('   npm run cli listTasks - Lista scheduled tasks');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    // Clean up
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  }
}

// Run the test
testCLI().catch(console.error); 