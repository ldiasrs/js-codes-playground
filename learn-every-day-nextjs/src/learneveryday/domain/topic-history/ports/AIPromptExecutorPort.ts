export interface AIPromptExecutorPort {
  /**
   * Executes an AI prompt and returns the generated content
   * @param prompt The prompt string to be executed
   * @returns Promise<string> The generated content
   * @throws Error if execution fails
   */
  execute(prompt: string): Promise<string>;
} 