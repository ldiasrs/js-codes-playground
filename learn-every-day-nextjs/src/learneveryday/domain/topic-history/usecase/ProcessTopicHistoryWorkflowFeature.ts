import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { ExecuteTopicHistoryGeneration } from './generate-topic-history/ExecuteTopicHistoryGeneration';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';
import { ScheduleTopicHistoryGeneration } from './schedule-topic-history-generation/ScheduleTopicHistoryGeneration';
import { CloseTopicsTaskRunner } from './close-topic/CloseTopicsTaskRunner';
import { ProcessFailedTopicsTaskRunner } from './process-failed-topics/ProcessFailedTopicsTaskRunner';
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
    private readonly scheduleTopicHistoryGeneration: ScheduleTopicHistoryGeneration,
    private readonly executeTopicHistoryGeneration: ExecuteTopicHistoryGeneration,
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
      this.scheduleTopicHistoryGeneration
    );

    await executor.execute(
      {
        processType: TaskProcess.GENERATE_TOPIC_HISTORY,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.executeTopicHistoryGeneration
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