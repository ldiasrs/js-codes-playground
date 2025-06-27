import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { CustomerRepositoryPort } from '../../customer/ports/CustomerRepositoryPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { ReGenerateTopicHistoryTaskRunner } from './ReGenerateTopicHistoryTaskRunner';
import { GenerateTopicHistoryTaskRunner } from './GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';

export interface ProcessTopicHistoryWorkflowFeatureData {
  limit?: number;
}

export class ProcessTopicHistoryWorkflowFeature {
  constructor(
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly scheduleGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner,
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {}

  async execute(data: ProcessTopicHistoryWorkflowFeatureData): Promise<void> {
    const { limit = 10 } = data;
    const startTime = new Date();

    try {
      this.logger.info('🚀 Starting task processing workflow for all customers');

      // Step 1: Schedule topic history generation
      await this.scheduleTopicHistoryGeneration(limit);

      // Step 2: Generate topic histories
      await this.generateTopicHistories(limit);

      // Step 3: Send topic histories
      await this.sendTopicHistories(limit);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.logger.info(`🎉 Task processing workflow completed in ${duration}ms`, { duration });

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('❌ Error during task processing workflow:', errorObj);
      throw errorObj;
    }
  }

  private async scheduleTopicHistoryGeneration(limit: number): Promise<void> {
    this.logger.info('📅 Step 1: Scheduling topic history generation...');
    
    const customers = await this.customerRepository.findAll();
    const limitedCustomers = customers.slice(0, limit);
    
    for (const customer of limitedCustomers) {
      const taskProcess = new TaskProcess(
        customer.id!,
        customer.id!,
        TaskProcess.REGENERATE_TOPIC_HISTORY,
        'pending'
      );
      
      await this.taskProcessRepository.save(taskProcess);
      await this.scheduleGenerateTopicHistoryTaskRunner.execute(taskProcess);
    }
    
    this.logger.info('✅ Topic history scheduling completed');
  }

  private async generateTopicHistories(limit: number): Promise<void> {
    this.logger.info('📝 Step 2: Generating topic histories...');
    
    const pendingTasks = await this.taskProcessRepository.findPendingTaskProcessByStatusAndType(
      'pending',
      TaskProcess.GENERATE_TOPIC_HISTORY,
      limit
    );
    
    for (const taskProcess of pendingTasks) {
      await this.generateTopicHistoryTaskRunner.execute(taskProcess);
    }
    
    this.logger.info('✅ Topic history generation completed');
  }

  private async sendTopicHistories(limit: number): Promise<void> {
    this.logger.info('📧 Step 3: Sending topic histories...');
    
    const pendingTasks = await this.taskProcessRepository.findPendingTaskProcessByStatusAndType(
      'pending',
      TaskProcess.SEND_TOPIC_HISTORY,
      limit
    );
    
    for (const taskProcess of pendingTasks) {
      await this.sendTopicHistoryTaskRunner.execute(taskProcess);
    }
    
    this.logger.info('✅ Topic history sending completed');
  }
} 