import { TaskProcess } from "../../../taskprocess/entities/TaskProcess";
import { LoggerPort } from "../../../shared/ports/LoggerPort";
import { ValidateCustomerProcessor } from "./ValidateCustomerProcessor";
import { CreateConfigProcessor, ReGenerateTopicHistoryConfig } from "./CreateConfigProcessor";
import { AnalyzeTasksProcessor, TaskAnalysis } from "./AnalyzeTasksProcessor";
import { SelectTopicsProcessor } from "./SelectTopicsProcessor";
import { ScheduleGenerateTasksBatchProcessor } from "./ScheduleGenerateTasksBatchProcessor";

// Interfaces moved to dedicated features

export class ReGenerateTopicHistoryTaskRunner {
  private static readonly BATCH_SIZE_LIMIT = 50;
  private static readonly CONCURRENCY_LIMIT = 5;
  private static readonly HOURS_24_IN_MS = 24 * 60 * 60 * 1000;
  private static readonly MAX_HISTORIES_BEFORE_CLOSE = 5;

  constructor(
    private readonly validateCustomerFeature: ValidateCustomerProcessor,
    private readonly createConfigFeature: CreateConfigProcessor,
    private readonly analyzeTasksFeature: AnalyzeTasksProcessor,
    private readonly selectTopicsForProcessingFeature: SelectTopicsProcessor,
    private readonly scheduleGenerateTasksBatchFeature: ScheduleGenerateTasksBatchProcessor,
    private readonly logger: LoggerPort
  ) {}

  async execute(taskProcess: TaskProcess): Promise<void> {
    const startTime = Date.now();
    const customerId = taskProcess.customerId;

    try {
      const customer = await this.validateCustomerFeature.execute(customerId);
      if (!customer) return;

      const config = this.createConfigFeature.execute(customer);
      const taskAnalysis = await this.analyzeTasksFeature.execute(customerId);

      if (this.shouldGenerateMoreTasks(taskAnalysis, config)) {
        await this.generateAdditionalTasks(customerId, taskAnalysis, config);
      } else {
        this.logTaskLimitReached(customerId, taskAnalysis.pendingTasksCount, config.maxTopicsPer24h);
      }

      this.logExecutionCompletion(customerId, startTime);
    } catch (error) {
      this.logger.error(`Failed to execute ReGenerateTopicHistoryTaskRunner for customer ${customerId}`, 
        error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private shouldGenerateMoreTasks(taskAnalysis: TaskAnalysis, config: ReGenerateTopicHistoryConfig): boolean {
    return taskAnalysis.pendingTasksCount < config.maxTopicsPer24h;
  }

  private async generateAdditionalTasks(
    customerId: string, 
    taskAnalysis: TaskAnalysis, 
    config: ReGenerateTopicHistoryConfig
  ): Promise<void> {
    this.logGeneratingMoreTasks(customerId, config.maxTopicsPer24h, taskAnalysis.pendingTasksCount);

    const topicsNeeded = this.calculateTopicsNeeded(config.maxTopicsPer24h, taskAnalysis.pendingTasksCount);
    const selectedTopics = await this.selectTopicsForProcessingFeature.execute(
      customerId,
      topicsNeeded,
      config.maxTopicsToProcess
    );
    const nextScheduleTime = this.calculateNextScheduleTime(taskAnalysis.lastSendTask);
    await this.scheduleGenerateTasksBatchFeature.execute(selectedTopics, customerId, nextScheduleTime);
  }

  private logGeneratingMoreTasks(customerId: string, maxTopics: number, pendingCount: number): void {
    this.logger.info(`Customer ${customerId} has less than ${maxTopics} pending tasks, generating more`, {
      customerId,
      maxTopicsPer24h: maxTopics,
      pendingTasksCount: pendingCount
    });
  }

  private calculateTopicsNeeded(maxTopicsPer24h: number, pendingTasksCount: number): number {
    return maxTopicsPer24h - pendingTasksCount;
  }

  private calculateNextScheduleTime(lastSendTask: TaskProcess | null): Date {
    if (lastSendTask) {
      return new Date(lastSendTask.createdAt.getTime() + ReGenerateTopicHistoryTaskRunner.HOURS_24_IN_MS);
    }
    return new Date(Date.now() + ReGenerateTopicHistoryTaskRunner.HOURS_24_IN_MS);
  }

  private logTaskLimitReached(customerId: string, pendingCount: number, maxTopics: number): void {
    this.logger.info(`Customer ${customerId} already has ${pendingCount} pending tasks, which meets the maximum limit of ${maxTopics} topics per 24h`);
  }

  private logExecutionCompletion(customerId: string, startTime: number): void {
    const totalExecutionTime = Date.now() - startTime;
    this.logger.info(`ReGenerateTopicHistoryTaskRunner completed for customer ${customerId}`, {
      customerId,
      executionTimeMs: totalExecutionTime,
    });
  }

  
}
