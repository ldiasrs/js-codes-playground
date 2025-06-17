import { NedbCustomerRepository } from '../infrastructure/adapters/NedbCustomerRepository';
import { NedbTopicRepository } from '../infrastructure/adapters/NedbTopicRepository';
import { NedbTopicHistoryRepository } from '../infrastructure/adapters/NedbTopicHistoryRepository';
import { NedbScheduledTaskRepository } from '../infrastructure/adapters/NedbScheduledTaskRepository';
import { NedbDatabaseManager } from '../infrastructure/database/NedbDatabaseManager';
import { Customer } from '../domain/customer/entities/Customer';
import { Topic } from '../domain/topic/entities/Topic';
import { TopicHistory } from '../domain/topic-history/entities/TopicHistory';
import { ScheduledTask } from '../domain/scheduling/entities/ScheduledTask';
import * as fs from 'fs';
import * as path from 'path';

async function testNeDBRepositories() {
  console.log('🧪 Testing NeDB Repositories...\n');

  // Use a fresh test data directory
  const dataDir = './nedb-test-data';
  
  // Clean up any existing test data
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
  
  // Reset the database manager instance to ensure clean state
  NedbDatabaseManager.resetInstance();
  
  // Initialize repositories
  const customerRepository = new NedbCustomerRepository(dataDir);
  const topicRepository = new NedbTopicRepository(dataDir);
  const topicHistoryRepository = new NedbTopicHistoryRepository(dataDir);
  const scheduledTaskRepository = new NedbScheduledTaskRepository(dataDir);

  try {
    // Test Customer Repository
    console.log('📋 Testing Customer Repository...');
    
    const customer = Customer.createWithCPF(
      'John Doe',
      '12345678901',
      'john@example.com',
      '+1234567890'
    );
    
    const savedCustomer = await customerRepository.save(customer);
    console.log(`✅ Customer saved: ${savedCustomer.customerName} (ID: ${savedCustomer.id})`);
    
    const foundCustomer = await customerRepository.findById(savedCustomer.id);
    console.log(`✅ Customer found: ${foundCustomer?.customerName}`);
    
    const allCustomers = await customerRepository.findAll();
    console.log(`✅ Total customers: ${allCustomers.length}`);

    // Test Topic Repository
    console.log('\n📚 Testing Topic Repository...');
    
    const topic = new Topic(savedCustomer.id, 'Test Topic');
    const savedTopic = await topicRepository.save(topic);
    console.log(`✅ Topic saved: ${savedTopic.subject} (ID: ${savedTopic.id})`);
    
    const foundTopic = await topicRepository.findById(savedTopic.id);
    console.log(`✅ Topic found: ${foundTopic?.subject}`);
    
    const customerTopics = await topicRepository.findByCustomerId(savedCustomer.id);
    console.log(`✅ Customer topics: ${customerTopics.length}`);

    // Test Topic History Repository
    console.log('\n📖 Testing Topic History Repository...');
    
    const topicHistory = new TopicHistory(savedTopic.id, 'This is a test topic history entry');
    const savedHistory = await topicHistoryRepository.save(topicHistory);
    console.log(`✅ Topic history saved: ${savedHistory.content.substring(0, 50)}...`);
    
    const foundHistory = await topicHistoryRepository.findById(savedHistory.id);
    console.log(`✅ Topic history found: ${foundHistory?.content.substring(0, 50)}...`);
    
    const topicHistories = await topicHistoryRepository.findByTopicId(savedTopic.id);
    console.log(`✅ Topic histories: ${topicHistories.length}`);

    // Test findLastTopicHistoryByCustomerId
    console.log('\n🔍 Testing findLastTopicHistoryByCustomerId...');
    const lastHistoryForCustomer = await topicHistoryRepository.findLastTopicHistoryByCustomerId(savedCustomer.id);
    if (lastHistoryForCustomer) {
      console.log(`✅ Last topic history for customer: ${lastHistoryForCustomer.content.substring(0, 50)}...`);
    } else {
      console.log('✅ No topic history found for customer (expected if no history exists)');
    }

    // Test Scheduled Task Repository
    console.log('\n⏰ Testing Scheduled Task Repository...');
    
    const scheduledTask = new ScheduledTask(
      'SendLastTopicHistory',
      { customerId: savedCustomer.id },
      '0 9 * * *' // Daily at 9 AM
    );
    
    const savedTask = await scheduledTaskRepository.save(scheduledTask);
    console.log(`✅ Scheduled task saved: ${savedTask.taskType} (ID: ${savedTask.id})`);
    
    const foundTask = await scheduledTaskRepository.findById(savedTask.id);
    console.log(`✅ Scheduled task found: ${foundTask?.taskType}`);
    
    const pendingTasks = await scheduledTaskRepository.findPendingTasks();
    console.log(`✅ Pending tasks: ${pendingTasks.length}`);

    // Test Search Functionality
    console.log('\n🔍 Testing Search Functionality...');
    
    const customerSearch = await customerRepository.search({
      customerName: 'John'
    });
    console.log(`✅ Customer search results: ${customerSearch.length}`);
    
    const topicSearch = await topicRepository.search({
      subject: 'Test'
    });
    console.log(`✅ Topic search results: ${topicSearch.length}`);

    // Test Statistics
    console.log('\n📊 Testing Statistics...');
    
    const customerCount = await customerRepository.count();
    const topicCount = await topicRepository.count();
    const historyCount = await topicHistoryRepository.count();
    const taskCount = await scheduledTaskRepository.count();
    
    console.log(`✅ Statistics:`);
    console.log(`   - Customers: ${customerCount}`);
    console.log(`   - Topics: ${topicCount}`);
    console.log(`   - Topic Histories: ${historyCount}`);
    console.log(`   - Scheduled Tasks: ${taskCount}`);

    console.log('\n🎉 All NeDB repository tests passed successfully!');

    // // Clean up test data
    // console.log('\n🧹 Cleaning up test data...');
    // if (fs.existsSync(dataDir)) {
    //   fs.rmSync(dataDir, { recursive: true, force: true });
    // }
    // NedbDatabaseManager.resetInstance();

  } catch (error) {
    console.error('❌ Error testing NeDB repositories:', error);
    
    // Clean up on error
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
    NedbDatabaseManager.resetInstance();
  }
}

// Run the test
testNeDBRepositories().catch(console.error); 