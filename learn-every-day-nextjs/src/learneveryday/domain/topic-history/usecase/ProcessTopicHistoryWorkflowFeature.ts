import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { GenerateTopicHistoryTaskRunner } from './GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from './ReGenerateTopicHistoryTaskRunner';

export interface ProcessTopicHistoryWorkflowFeatureData {
  limit?: number;
}

export class ProcessTopicHistoryWorkflowFeature {
  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly reGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner,
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {}

  async execute(data: ProcessTopicHistoryWorkflowFeatureData): Promise<void> {
    const { limit = 10 } = data;
    const startTime = new Date();

    try {
      this.logger.info('🚀 Starting task processing workflow for all customers');
      await this.scheduleTopicHistoryGeneration(limit);

      await this.generateTopicHistories(limit);

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
    
    const pendingTasks = await this.taskProcessRepository.findPendingTaskProcessByStatusAndType(
      'pending',
      TaskProcess.REGENERATE_TOPICS_HISTORIES,
      limit
    );
    
    for (const taskProcess of pendingTasks) {
      await this.reGenerateTopicHistoryTaskRunner.execute(taskProcess);
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