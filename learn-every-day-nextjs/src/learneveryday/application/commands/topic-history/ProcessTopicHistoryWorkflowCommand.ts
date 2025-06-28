import { BaseCommand } from '../Command';
import { ProcessTopicHistoryWorkflowFeature, ProcessTopicHistoryWorkflowFeatureData } from '../../../domain/topic-history/usecase/ProcessTopicHistoryWorkflowFeature';

export interface ProcessTopicHistoryWorkflowCommandData {
  limit?: number;
}

export class ProcessTopicHistoryWorkflowCommand extends BaseCommand<void, ProcessTopicHistoryWorkflowCommandData> {
  constructor(
    private readonly processTopicHistoryWorkflowFeature: ProcessTopicHistoryWorkflowFeature
  ) {
    super();
  }

  async execute(data: ProcessTopicHistoryWorkflowCommandData): Promise<void> {
    const featureData: ProcessTopicHistoryWorkflowFeatureData = {
      limit: data.limit
    };

   this.processTopicHistoryWorkflowFeature.execute(featureData);
   
  }
} 