import { Prompt } from "../../domain/model/Prompt";

/**
 * Driven port: a provider-agnostic LLM. Adapters (Claude, Gemini, OpenAI)
 * implement this; the application never imports a concrete provider.
 */
export interface LlmGateway {
  /** Human-readable provider id, e.g. "claude". Used only for logging. */
  readonly name: string;
  /** Returns the raw model text, expected to contain a JSON object. */
  complete(prompt: Prompt): Promise<string>;
}
