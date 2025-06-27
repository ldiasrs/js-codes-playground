import { BaseCommand } from '../Command';
import { TaskProcess } from '../../../domain/taskprocess/entities/TaskProcess';
import { LoggerPort } from '../../../domain/shared/ports/LoggerPort';
import { ExecuteTaskProcessCommand } from '../taskprocess/ExecuteTaskProcessCommand';
import { ReGenerateTopicHistoryTaskRunner } from '../../../domain/topic-history/usecase/ReGenerateTopicHistoryTaskRunner';
import { GenerateTopicHistoryTaskRunner } from '../../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { SendTopicHistoryTaskRunner } from '../../../domain/topic-history/usecase/SendTopicHistoryTaskRunner';

export interface ProcessTopicHistoryWorkflowCommandData {
  limit?: number;
}

export class ProcessTopicHistoryWorkflowCommand extends BaseCommand<void, ProcessTopicHistoryWorkflowCommandData> {
  constructor(
    private readonly executeTaskProcessCommand: ExecuteTaskProcessCommand,
    private readonly scheduleGenerateTopicHistoryTaskRunner: ReGenerateTopicHistoryTaskRunner,
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly sendTopicHistoryTaskRunner: SendTopicHistoryTaskRunner,
    private readonly logger: LoggerPort
  ) {
    super();
  }

  async execute(data: ProcessTopicHistoryWorkflowCommandData): Promise<void> {
    const { limit = 10 } = data;
    const startTime = new Date();

    try {
      this.logger.info('🚀 Starting task processing workflow for all customers');

      // Step 1: Schedule topic history generation
      this.logger.info('📅 Step 1: Scheduling topic history generation...');
      this.executeTaskProcessCommand.setRunner(this.scheduleGenerateTopicHistoryTaskRunner);
      await this.executeTaskProcessCommand.execute({
        processType: TaskProcess.REGENERATE_TOPIC_HISTORY,
        limit
      });
      this.logger.info('✅ Topic history scheduling completed');

      // Step 2: Generate topic histories
      this.logger.info('📝 Step 2: Generating topic histories...');
      this.executeTaskProcessCommand.setRunner(this.generateTopicHistoryTaskRunner);
      await this.executeTaskProcessCommand.execute({
        processType: TaskProcess.GENERATE_TOPIC_HISTORY,
        limit
      });
      this.logger.info('✅ Topic history generation completed');

      // Step 3: Send topic histories
      this.logger.info('📧 Step 3: Sending topic histories...');
      this.executeTaskProcessCommand.setRunner(this.sendTopicHistoryTaskRunner);
      await this.executeTaskProcessCommand.execute({
        processType: TaskProcess.SEND_TOPIC_HISTORY,
        limit
      });
      this.logger.info('✅ Topic history sending completed');

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.logger.info(`🎉 Task processing workflow completed in ${duration}ms`, { duration });

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('❌ Error during task processing workflow:', errorObj);
      throw errorObj;
    }
  }
} 