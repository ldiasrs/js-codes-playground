import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../topic-history/ports/TopicHistoryRepositoryPort';
import { SendTopicHistoryFeature } from '../../topic-history/features/SendTopicHistoryFeature';
import { TaskExecutorPort } from '../ports/TaskExecutorPort';
import { ScheduledTask } from '../entities/ScheduledTask';

export class SendLastTopicHistoryTask implements TaskExecutorPort {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly sendTopicHistoryFeature: SendTopicHistoryFeature
  ) {}

  canHandle(taskType: string): boolean {
    return taskType === 'SendLastTopicHistory';
  }

  async execute(task: ScheduledTask): Promise<void> {
    try {
      console.log(`🚀 Executing SendLastTopicHistoryTask for task ID: ${task.id}`);

      // Step 1: Get all customers
      const customers = await this.customerRepository.findAll();
      
      if (customers.length === 0) {
        console.log('📭 No customers found. Skipping task execution.');
        return;
      }

      console.log(`👥 Found ${customers.length} customers to process`);

      // Step 2: Process each customer
      for (const customer of customers) {
        try {
          await this.processCustomer(customer);
        } catch (error) {
          console.error(`❌ Error processing customer ${customer.customerName} (${customer.id}):`, error);
          // Continue with other customers even if one fails
        }
      }

      console.log(`✅ SendLastTopicHistoryTask completed for task ID: ${task.id}`);

    } catch (error) {
      console.error(`❌ SendLastTopicHistoryTask failed for task ID: ${task.id}:`, error);
      throw error;
    }
  }

  private async processCustomer(customer: any): Promise<void> {
    // Step 1: Get the latest topic history for this customer
    const latestTopicHistory = await this.getLatestTopicHistoryForCustomer(customer.id);
    
    if (!latestTopicHistory) {
      console.log(`📭 No topic history found for customer ${customer.customerName} (${customer.id})`);
      return;
    }

    // Step 2: Send the topic history to the customer
    await this.sendTopicHistoryFeature.execute({
      customer: customer,
      topicHistory: latestTopicHistory,
      channel: 'email'
    });

    console.log(`📧 Sent topic history to customer ${customer.customerName} (${customer.id})`);
  }

  private async getLatestTopicHistoryForCustomer(customerId: string): Promise<any | undefined> {
    // Delegate to repository to find the latest topic history for this customer
    return await this.topicHistoryRepository.findLastTopicHistoryByCustomerId(customerId);
  }
} 