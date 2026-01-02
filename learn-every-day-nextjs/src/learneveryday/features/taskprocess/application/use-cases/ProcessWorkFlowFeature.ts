import { LoggerPort } from "@/learneveryday/shared";
import { CloseTopicsTaskRunner } from "../../domain/CloseTopicsTaskRunner";
import { ExecuteTopicHistoryGenerationTaskRunner } from "../../domain/ExecuteTopicHistoryGenerationTaskRunner";
import { ProcessFailedTopicsTaskRunner } from "../../domain/process-failed-topics/ProcessFailedTopicsTaskRunner";
import { ScheduleTopicHistoryGenerationTaskRunner } from "../../domain/schedule-topic-history-generation/ScheduleTopicHistoryGenerationTaskRunner";
import { SendTopicHistoryTaskRunner } from "../../domain/SendTopicHistoryTaskRunner";
import { TaskProcess } from "../../domain/TaskProcess";
import { TasksProcessExecutor } from "../../domain/TasksProcessExecutor";
import { TaskProcessRepositoryPort } from "../../ports/TaskProcessRepositoryPort";

export interface ProcessWorkFlowFeatureInput {
  limit?: number;
  maxExecutionTimeMs?: number; // Timeout protection for Vercel
}

export class ProcessWorkFlowFeature {

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly processFailedTopicsTaskRunner: ProcessFailedTopicsTaskRunner,
    private readonly closeTopicsTaskRunner: CloseTopicsTaskRunner,
    private readonly scheduleTopicHistoryGenerationTaskRunner: ScheduleTopicHistoryGenerationTaskRunner,
    private readonly executeTopicHistoryGenerationTaskRunner: ExecuteTopicHistoryGenerationTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {
   
  }

  async execute(data: ProcessWorkFlowFeatureInput = {}): Promise<void> {
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
      this.scheduleTopicHistoryGenerationTaskRunner
    );

    await executor.execute(
      {
        processType: TaskProcess.GENERATE_TOPIC_HISTORY,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.executeTopicHistoryGenerationTaskRunner
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