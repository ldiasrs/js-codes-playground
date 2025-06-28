import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { GenerateTopicHistoryTaskRunner } from './GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from './ReGenerateTopicHistoryTaskRunner';
import { TaskWorkflowFeature, type TaskWorkflowFeatureData } from '../../shared/usecase/TaskWorkflowFeature';

export interface ProcessTopicHistoryWorkflowFeatureData {
  limit?: number;
}

export class ProcessTopicHistoryWorkflowFeature {
  private readonly workflowFeature: TaskWorkflowFeature;

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly reGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner,
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {
    // Initialize the workflow with the specific topic history steps
    this.workflowFeature = new TaskWorkflowFeature(
      taskProcessRepository,
      logger,
      {
        name: 'Scheduling Topic History Generation',
        taskType: TaskProcess.REGENERATE_TOPICS_HISTORIES,
        runner: reGenerateTopicHistoryTaskRunner
      },
      {
        name: 'Generating Topic Histories',
        taskType: TaskProcess.GENERATE_TOPIC_HISTORY,
        runner: generateTopicHistoryTaskRunner
      },
      {
        name: 'Sending Topic Histories',
        taskType: TaskProcess.SEND_TOPIC_HISTORY,
        runner: sendTopicHistoryTaskRunner
      }
    );
  }

  async execute(data: ProcessTopicHistoryWorkflowFeatureData): Promise<void> {
    const workflowData: TaskWorkflowFeatureData = {
      limit: data.limit
    };

    await this.workflowFeature.execute(workflowData);
  }
} 