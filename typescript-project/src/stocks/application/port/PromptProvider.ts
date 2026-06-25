/** Driven port: supplies the editable base analysis prompt. */
export interface PromptProvider {
  basePrompt(): Promise<string>;
}
