import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { GenerateTopicHistoryTaskRunner } from './GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from './SendTopicHistoryTaskRunner';
import { ReGenerateTopicHistoryTaskRunner } from './ReGenerateTopicHistoryTaskRunner';
import { TasksProcessExecutor } from '../../taskprocess';

export interface ProcessTopicHistoryWorkflowFeatureData {
  limit?: number;
}

export class ProcessTopicHistoryWorkflowFeature {

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly reGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner,
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {
   
  }

  async execute(): Promise<void> {
    const executor = new TasksProcessExecutor(this.taskProcessRepository, this.logger);
    await executor.execute(
      {
        processType: TaskProcess.REGENERATE_TOPICS_HISTORIES
      },
      this.reGenerateTopicHistoryTaskRunner
    );

    await executor.execute(
      {
        processType: TaskProcess.GENERATE_TOPIC_HISTORY
      },
      this.generateTopicHistoryTaskRunner
    );

    await executor.execute(
      {
        processType: TaskProcess.SEND_TOPIC_HISTORY
      },
      this.sendTopicHistoryTaskRunner
    );

  }
} 