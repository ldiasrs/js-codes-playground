/** A provider-agnostic prompt pair handed to any LLM gateway. */
export interface Prompt {
  readonly system: string;
  readonly user: string;
}
