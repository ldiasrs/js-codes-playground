import 'reflect-metadata';
import { ContainerBuilder } from '../infrastructure/di/container';
import { TYPES } from '../infrastructure/di/types';
import { NedbDatabaseManager } from '../infrastructure/database/NedbDatabaseManager';
import { CustomerRepositoryPort } from '../domain/customer/ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../domain/topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { ScheduledTaskRepositoryPort } from '../domain/scheduling/ports/ScheduledTaskRepositoryPort';
import * as fs from 'fs';

// Test script to verify InversifyJS dependency injection
async function testDependencyInjection() {
  console.log('🧪 Testando InversifyJS Dependency Injection...\n');

  // Clean up test data directory
  const testDataDir = './data/test/led';
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDataDir, { recursive: true });

  // Reset database manager for testing
  NedbDatabaseManager.resetInstance();

  try {
    // Test 1: Build container
    console.log('1️⃣ Construindo container...');
    const container = ContainerBuilder.build(testDataDir);
    console.log('   ✅ Container construído com sucesso\n');

    // Test 2: Get repositories from container
    console.log('2️⃣ Testando injeção de repositórios...');
    
    const customerRepository = container.get<CustomerRepositoryPort>(TYPES.CustomerRepository);
    console.log('   ✅ CustomerRepository injetado');
    
    const topicRepository = container.get<TopicRepositoryPort>(TYPES.TopicRepository);
    console.log('   ✅ TopicRepository injetado');
    
    const topicHistoryRepository = container.get<TopicHistoryRepositoryPort>(TYPES.TopicHistoryRepository);
    console.log('   ✅ TopicHistoryRepository injetado');
    
    const scheduledTaskRepository = container.get<ScheduledTaskRepositoryPort>(TYPES.ScheduledTaskRepository);
    console.log('   ✅ ScheduledTaskRepository injetado\n');

    // Test 3: Get ports from container
    console.log('3️⃣ Testando injeção de ports...');
    
    const generateTopicHistoryPort = container.get(TYPES.GenerateTopicHistoryPort);
    console.log('   ✅ GenerateTopicHistoryPort injetado');
    
    const sendTopicHistoryByEmailPort = container.get(TYPES.SendTopicHistoryByEmailPort);
    console.log('   ✅ SendTopicHistoryByEmailPort injetado\n');

    // Test 4: Get services from container
    console.log('4️⃣ Testando injeção de services...');
    
    const schedulingService = container.get(TYPES.SchedulingService);
    console.log('   ✅ SchedulingService injetado\n');

    // Test 5: Verify singleton behavior
    console.log('5️⃣ Testando comportamento singleton...');
    
    const customerRepo1 = container.get<CustomerRepositoryPort>(TYPES.CustomerRepository);
    const customerRepo2 = container.get<CustomerRepositoryPort>(TYPES.CustomerRepository);
    
    if (customerRepo1 === customerRepo2) {
      console.log('   ✅ Repositórios são singletons (mesma instância)');
    } else {
      console.log('   ❌ Repositórios não são singletons');
    }

    // Test 6: Test repository methods
    console.log('6️⃣ Testando métodos dos repositórios...');
    
    const customerCount = await customerRepository.count();
    console.log(`   ✅ CustomerRepository.count(): ${customerCount}`);
    
    const topicCount = await topicRepository.count();
    console.log(`   ✅ TopicRepository.count(): ${topicCount}`);
    
    const topicHistoryCount = await topicHistoryRepository.count();
    console.log(`   ✅ TopicHistoryRepository.count(): ${topicHistoryCount}`);
    
    const scheduledTaskCount = await scheduledTaskRepository.count();
    console.log(`   ✅ ScheduledTaskRepository.count(): ${scheduledTaskCount}\n`);

    console.log('🎉 Todos os testes de Dependency Injection passaram!');
    console.log('\n📋 Benefícios implementados:');
    console.log('   ✅ Inversão de Controle (IoC)');
    console.log('   ✅ Injeção de Dependência (DI)');
    console.log('   ✅ Gerenciamento centralizado de dependências');
    console.log('   ✅ Facilita testes unitários');
    console.log('   ✅ Reduz acoplamento entre classes');
    console.log('   ✅ Melhora a manutenibilidade do código');
    console.log('   ✅ Abordagem híbrida: DI para repositórios/ports, factory para features/commands');

  } catch (error) {
    console.error('❌ Erro durante os testes de DI:', error);
  } finally {
    // Clean up
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    ContainerBuilder.reset();
  }
}

// Run the test
testDependencyInjection().catch(console.error); 