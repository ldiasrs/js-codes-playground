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
    
    // Phase 0: Process failed topics first to reprocess recoverable failures
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded before starting workflow phases', {
        customerId: "not-provided"
      });
      return;
    }

    await executor.execute(
      {
        processType: TaskProcess.PROCESS_FAILED_TOPICS,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.processFailedTopicsTaskRunner
    );

    // Phase 1: Execute close topics tasks
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded after process failed topics phase', {
        customerId: "not-provided"
      });
      return;
    }

    await executor.execute(
      {
        processType: TaskProcess.CLOSE_TOPIC,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.closeTopicsTaskRunner
    );

    // Phase 2: Regenerate topics histories
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded after close topics phase', {
        customerId: "not-provided"
      });
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

    // Phase 3: Generate topic history
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded after regenerate phase', {
        customerId: "not-provided"
      });
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

    // Phase 4: Send topic history
    if (Date.now() - startTime > maxExecutionTimeMs) {
      this.logger.warn('Execution time limit exceeded after generate phase', {
        customerId: "not-provided"
      });
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
      customerId: "not-provided",
      executionTimeMs: totalExecutionTime,
      maxExecutionTimeMs
    });
  }
} 