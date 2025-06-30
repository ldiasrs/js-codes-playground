import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { GenerateTopicHistoryTaskRunner } from './GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from './ReGenerateTopicHistoryTaskRunner';
import { TasksProcessExecutor } from '../../taskprocess';

export interface ProcessTopicHistoryWorkflowFeatureData {
  limit?: number;
  maxExecutionTimeMs?: number; // Timeout protection for Vercel
}

export class ProcessTopicHistoryWorkflowFeature {

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly reGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner,
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {
   
  }

  async execute(data: ProcessTopicHistoryWorkflowFeatureData = {}): Promise<void> {
    const { limit = 5, maxExecutionTimeMs = 8000 } = data; // Reduced limit for Vercel
    const startTime = Date.now();

    this.logger.info('Starting topic history workflow execution', {
      limit,
      maxExecutionTimeMs
    });

    const executor = new TasksProcessExecutor(this.taskProcessRepository, this.logger);
    
    // Check timeout before each phase
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded before starting workflow phases');
      return;
    }

    await executor.execute(
      {
        processType: TaskProcess.REGENERATE_TOPICS_HISTORIES,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.reGenerateTopicHistoryTaskRunner
    );

    // Check timeout before next phase
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded after regenerate phase');
      return;
    }

    await executor.execute(
      {
        processType: TaskProcess.GENERATE_TOPIC_HISTORY,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.generateTopicHistoryTaskRunner
    );

    // Check timeout before final phase
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded after generate phase');
      return;
    }

    await executor.execute(
      {
        processType: TaskProcess.SEND_TOPIC_HISTORY,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.sendTopicHistoryTaskRunner
    );

    const totalExecutionTime = Date.now() - startTime;
    this.logger.info('Topic history workflow execution completed', {
      executionTimeMs: totalExecutionTime,
      maxExecutionTimeMs
    });
  }
} 