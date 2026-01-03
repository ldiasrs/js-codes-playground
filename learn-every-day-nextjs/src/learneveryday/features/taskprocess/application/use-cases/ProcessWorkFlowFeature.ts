import { LoggerPort } from "@/learneveryday/shared";
import { TaskProcess } from "../../domain/api/TaskProcess";
import { TasksProcessExecutor } from "../../domain/api/TasksProcessExecutor";
import { CloseTopicsTaskRunner } from "../../domain/close-topics/CloseTopicsTaskRunner";
import { ExecuteTopicHistoryGenerationTaskRunner } from "../../domain/generate-topic-history/ExecuteTopicHistoryGenerationTaskRunner";
import { ReProcessFailedTopicsTaskRunner } from "../../domain/process-failed-topics/ReProcessFailedTopicsTaskRunner";
import { ScheduleTopicHistoryGenerationTaskRunner } from "../../domain/schedule-topic-history-generation/ScheduleTopicHistoryGenerationTaskRunner";
import { SendTopicHistoryTaskRunner } from "../../domain/send-topic-history/SendTopicHistoryTaskRunner";
import { CleanupOrphanTasksRunner } from "../../domain/cleanup-orphan-tasks/CleanupOrphanTasksRunner";
import { ScheduleMissingGenerationTasksRunner } from "../../domain/schedule-missing-generation-tasks/ScheduleMissingGenerationTasksRunner";
import { TaskProcessRepositoryPort } from "../../ports/TaskProcessRepositoryPort";

export interface ProcessWorkFlowFeatureInput {
  limit?: number;
  maxExecutionTimeMs?: number; // Timeout protection for Vercel
}

export class ProcessWorkFlowFeature {

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly cleanupOrphanTasksRunner: CleanupOrphanTasksRunner,
    private readonly scheduleMissingGenerationTasksRunner: ScheduleMissingGenerationTasksRunner,
    private readonly reProcessFailedTopicsTaskRunner: ReProcessFailedTopicsTaskRunner,
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
    
    try {
      await this.cleanupOrphanTasksRunner.execute();
    } catch (error) {
      this.logger.error(
        'Failed to cleanup orphan tasks, continuing with workflow',
        error instanceof Error ? error : new Error(String(error))
      );
    }

    try {
      await this.scheduleMissingGenerationTasksRunner.execute();
    } catch (error) {
      this.logger.error(
        'Failed to schedule missing generation tasks, continuing with workflow',
        error instanceof Error ? error : new Error(String(error))
      );
    }

    await executor.execute(
      {
        processType: TaskProcess.REPROCESS_FAILED_TOPICS,
        limit,
        maxExecutionTimeMs: maxExecutionTimeMs - (Date.now() - startTime)
      },
      this.reProcessFailedTopicsTaskRunner
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