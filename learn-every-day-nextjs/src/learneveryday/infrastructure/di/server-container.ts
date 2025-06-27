import { NextJSContainer } from './nextjs-container';
import { TriggerTaskProcessExecutorCron } from '../scheduler/TriggerTaskProcessExecutorCron';

export class ServerContainer extends NextJSContainer {
  constructor() {
    super();
    this.initializeServerServices();
  }

  private initializeServerServices(): void {
    // Register server-side only services
    this.registerSingleton('TriggerTaskProcessExecutorCron', () => new TriggerTaskProcessExecutorCron(
      this.get('TasksProcessExecutor'),
      this.get('GenerateTopicHistoryTaskRunner'),
      this.get('SendTopicHistoryTaskRunner'),
      this.get('ReGenerateTopicHistoryTaskRunner'),
      this.get('Logger')
    ));
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
      this.container.reset();
      this.container = null as unknown as ServerContainer;
    }
  }
} 