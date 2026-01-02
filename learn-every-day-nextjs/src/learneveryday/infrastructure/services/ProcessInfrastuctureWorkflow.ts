import { LoggerPort } from '../../shared/ports/LoggerPort';
import { CleanOldLogsProcess } from '../adapters/loggers/CleanOldLogsProcess';


export class ProcessInfrastuctureWorkflow {

  constructor(
    private readonly cleanOldLogsProcess: CleanOldLogsProcess,
    private readonly logger: LoggerPort
  ) {}

  async execute(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logWorkflowStart(startTime);
      
      await this.executeLogCleanupPhase();
      
      this.logWorkflowCompletion(startTime);
    } catch (error) {
      this.logWorkflowError(error, startTime);
      throw error;
    }
  }

 

  private async executeLogCleanupPhase(): Promise<void> {
    try {
      await this.cleanOldLogsProcess.execute();
    } catch (error) {
      this.logPhaseError('log cleanup', error);
    }
  }


  private logWorkflowStart(startTime: number): void {
    this.logger.info('Starting ProcessInfrastuctureWorkflow execution', {
      workflow: 'infrastructure-maintenance',
      startTime: startTime
    });
  }

  /**
   * Logs the successful completion of the workflow
   * @param startTime Workflow start time
   * @param maxExecutionTimeMs Maximum allowed execution time
   */
  private logWorkflowCompletion(startTime: number): void {
    const executionTime = Date.now() - startTime;
    
    this.logger.info('ProcessInfrastuctureWorkflow completed successfully', {
      workflow: 'infrastructure-maintenance',
      executionTimeMs: executionTime,
    });
  }

  /**
   * Logs errors that occur during workflow execution
   * @param error The error that occurred
   * @param startTime Workflow start time
   */
  private logWorkflowError(error: unknown, startTime: number): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const executionTime = Date.now() - startTime;
    
    this.logger.error('ProcessInfrastuctureWorkflow failed', errorObj, {
      workflow: 'infrastructure-maintenance',
      executionTimeMs: executionTime
    });
  }


  private logPhaseError(phaseName: string, error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    this.logger.error(`Failed during ${phaseName} phase`, errorObj, {
      workflow: 'infrastructure-maintenance',
      phase: phaseName
    });
  }


} 