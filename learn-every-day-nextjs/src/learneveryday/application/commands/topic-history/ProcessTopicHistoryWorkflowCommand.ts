import { BaseCommand } from '../Command';
import { ProcessTopicHistoryWorkflowFeature } from '../../../domain/topic-history/usecase/ProcessTopicHistoryWorkflowFeature';

export interface ProcessTopicHistoryWorkflowCommandData {
  limit?: number;
}

export class ProcessTopicHistoryWorkflowCommand extends BaseCommand<void, ProcessTopicHistoryWorkflowCommandData> {
  constructor(
    private readonly processTopicHistoryWorkflowFeature: ProcessTopicHistoryWorkflowFeature
  ) {
    super();
  }

  async execute(): Promise<void> {

   this.processTopicHistoryWorkflowFeature.execute();
   
  }
} 