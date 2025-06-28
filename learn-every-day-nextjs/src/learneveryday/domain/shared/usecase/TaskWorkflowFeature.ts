import { TaskProcessType } from '../../taskprocess/entities/TaskProcess';
import { LoggerPort } from '../ports/LoggerPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { TaskProcessRunner } from '../../taskprocess/ports/TaskProcessRunner';
import { TasksProcessExecutor } from '../../taskprocess/usecase/TasksProcessExecutor';

export interface WorkflowStep {
  name: string;
  taskType: TaskProcessType;
  runner: TaskProcessRunner;
  limit?: number;
}

export interface TaskWorkflowFeatureData {
  steps?: WorkflowStep[];
  limit?: number;
}

export class TaskWorkflowFeature {
  private readonly defaultSteps: WorkflowStep[] = [];

  constructor(
    private readonly taskProcessRepository: TaskProcessRepositoryPort,
    private readonly logger: LoggerPort,
    ...defaultRunners: { taskType: TaskProcessType; runner: TaskProcessRunner; name: string }[]
  ) {
    // Initialize default steps from provided runners
    this.defaultSteps = defaultRunners.map(({ taskType, runner, name }) => ({
      name,
      taskType,
      runner,
      limit: 10
    }));
  }

  async execute(data: TaskWorkflowFeatureData): Promise<void> {
    const { steps = this.defaultSteps, limit = 10 } = data;
    const startTime = new Date();

    try {
      this.logger.info('🚀 Starting task processing workflow', { 
        stepCount: steps.length,
        defaultLimit: limit 
      });

      const executor = new TasksProcessExecutor(this.taskProcessRepository, this.logger);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepNumber = i + 1;
        
        this.logger.info(`📋 Step ${stepNumber}/${steps.length}: ${step.name}`, {
          stepNumber,
          totalSteps: steps.length,
          taskType: step.taskType,
          limit: step.limit || limit
        });

        await executor.execute({
          processType: step.taskType,
          limit: step.limit || limit
        }, step.runner);

        this.logger.info(`✅ Step ${stepNumber} completed: ${step.name}`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.logger.info(`🎉 Task processing workflow completed in ${duration}ms`, { 
        duration,
        totalSteps: steps.length 
      });

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('❌ Error during task processing workflow:', errorObj);
      throw errorObj;
    }
  }
} 