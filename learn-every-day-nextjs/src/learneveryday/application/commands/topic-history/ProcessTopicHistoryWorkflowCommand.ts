import { BaseCommand } from '../Command';
import { ProcessTopicHistoryWorkflowFeature } from '../../../domain/topic-history/usecase/ProcessTopicHistoryWorkflowFeature';

export interface ProcessTopicHistoryWorkflowCommandData {
  limit?: number;
  maxExecutionTimeMs?: number; // Timeout protection for Vercel
}

export class ProcessTopicHistoryWorkflowCommand extends BaseCommand<void, ProcessTopicHistoryWorkflowCommandData> {
  constructor(
    private readonly processTopicHistoryWorkflowFeature: ProcessTopicHistoryWorkflowFeature
  ) {
    super();
  }

  async execute(data: ProcessTopicHistoryWorkflowCommandData = {}): Promise<void> {
     this.processTopicHistoryWorkflowFeature.execute(data);
  }
} 