import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { GenerateTopicHistoryTaskRunner } from './GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from './ReGenerateTopicHistoryTaskRunner';
import { CloseTopicsTaskRunner } from './CloseTopicsTaskRunner';
import { ProcessFailedTopicsTaskRunner } from './ProcessFailedTopicsTaskRunner';
import { TasksProcessExecutor } from '../../taskprocess';

export interface ProcessTopicHistoryWorkflowFeatureData {
  limit?: number;
  maxExecutionTimeMs?: number; // Timeout protection for Vercel
}

export class ProcessTopicHistoryWorkflowFeature {

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly processFailedTopicsTaskRunner: ProcessFailedTopicsTaskRunner,
    private readonly closeTopicsTaskRunner: CloseTopicsTaskRunner,
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
      customerId: "not-provided",
      limit,
      maxExecutionTimeMs
    });

    const executor = new TasksProcessExecutor(this.taskProcessRepository, this.logger);
    
   

    await executor.execute(
      {
        processType: TaskProcess.PROCESS_FAILED_TOPICS,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.processFailedTopicsTaskRunner
    );


    await executor.execute(
      {
        processType: TaskProcess.CLOSE_TOPIC,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.closeTopicsTaskRunner
    );


    await executor.execute(
      {
        processType: TaskProcess.REGENERATE_TOPICS_HISTORIES,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.reGenerateTopicHistoryTaskRunner
    );

    await executor.execute(
      {
        processType: TaskProcess.GENERATE_TOPIC_HISTORY,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.generateTopicHistoryTaskRunner
    );


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
      customerId: "not-provided",
      executionTimeMs: totalExecutionTime,
      maxExecutionTimeMs
    });
  }
} 