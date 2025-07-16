import { BaseCommand } from '../Command';
import { ProcessTopicHistoryWorkflowFeature } from '../../../domain/topic-history/usecase/ProcessTopicHistoryWorkflowFeature';
import { ProcessInfrastuctureWorkflow } from '@/learneveryday/infrastructure/services/ProcessInfrastuctureWorkflow';

export interface ProcessTopicHistoryWorkflowCommandData {
  limit?: number;
  maxExecutionTimeMs?: number; // Timeout protection for Vercel
}

export class ProcessTopicHistoryWorkflowCommand extends BaseCommand<void, ProcessTopicHistoryWorkflowCommandData> {
  constructor(
    private readonly processTopicHistoryWorkflowFeature: ProcessTopicHistoryWorkflowFeature,
    private readonly processInfrastuctureWorkflow: ProcessInfrastuctureWorkflow
  ) {
    super();
  }

  async execute(data: ProcessTopicHistoryWorkflowCommandData = {}): Promise<void> {
    await this.processTopicHistoryWorkflowFeature.execute(data);
    await this.processInfrastuctureWorkflow.execute();
    return;
  }
} 