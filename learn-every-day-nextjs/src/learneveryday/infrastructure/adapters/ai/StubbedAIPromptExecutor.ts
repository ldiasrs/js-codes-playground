import { AIPromptExecutorPort } from '../../../features/topic-histoy/application/ports/AIPromptExecutorPort';
import { LoggerPort } from '../../../shared/ports/LoggerPort';

/**
 * Stubbed implementation of AIPromptExecutorPort for testing and development.
 * Returns a predictable mock response without calling an actual AI service.
 */
export class StubbedAIPromptExecutor implements AIPromptExecutorPort {
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Executes a stubbed AI prompt and returns a mock generated content.
   * @param prompt The prompt string to be executed
   * @param customerId Optional customer ID for logging context
   * @returns Promise<string> A mock generated content
   */
  async execute(prompt: string, customerId?: string): Promise<string> {
    this.logger.info('Executing stubbed AI prompt (no actual AI call)', {
      customerId: customerId || 'not-provided',
      promptLength: prompt.length
    });

    const mockContent = this.generateMockContent(prompt);

    this.logger.info('Stubbed AI prompt executed successfully', {
      customerId: customerId || 'not-provided',
      contentLength: mockContent.length
    });

    return mockContent;
  }

  private generateMockContent(prompt: string): string {
    return `promptPreview:${prompt} Timestamp:${new Date()}`;
  }
}

