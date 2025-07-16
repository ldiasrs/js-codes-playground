export interface AIPromptExecutorPort {
  /**
   * Executes an AI prompt and returns the generated content
   * @param prompt The prompt string to be executed
   * @param customerId Optional customer ID for logging context
   * @returns Promise<string> The generated content
   * @throws Error if execution fails
   */
  execute(prompt: string, customerId?: string): Promise<string>;
} 