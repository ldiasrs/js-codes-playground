import { NextJSContainer } from './nextjs-container';
import { TriggerTaskProcessExecutorCron } from '../scheduler/TriggerTaskProcessExecutorCron';

export class ServerContainer extends NextJSContainer {
  private cronScheduler: TriggerTaskProcessExecutorCron | null = null;

  constructor() {
    super();
    this.initializeServerServices();
  }

  private initializeServerServices(): void {
    this.registerSingleton('TriggerTaskProcessExecutorCron', () => new TriggerTaskProcessExecutorCron(
      this.get('ProcessTopicHistoryWorkflowCommand'),
      this.get('Logger')
    ));
  }

  getCronScheduler(): TriggerTaskProcessExecutorCron | null {
    return this.cronScheduler;
  }
}

export class ServerContainerBuilder {
  private static container: ServerContainer;

  public static build(): ServerContainer {
    if (!this.container) {
      this.container = new ServerContainer();
    }
    return this.container;
  }

  public static reset(): void {
    if (this.container) {
      // Stop cron scheduler before resetting
      this.container.reset();
      this.container = null as unknown as ServerContainer;
    }
  }

  /**
   * Gracefully shuts down the server container
   */
  public static shutdown(): void {
    if (this.container) {
      this.container = null as unknown as ServerContainer;
    }
  }
} 