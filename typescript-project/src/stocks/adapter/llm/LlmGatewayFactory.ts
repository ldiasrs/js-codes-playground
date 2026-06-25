import { LlmGateway } from "../../application/port/LlmGateway";
import { AnthropicLlmGateway } from "./AnthropicLlmGateway";
import { GeminiLlmGateway } from "./GeminiLlmGateway";
import { OpenAiLlmGateway } from "./OpenAiLlmGateway";
import { CliLlmGateway } from "./CliLlmGateway";

/** API-key based providers. */
export type ApiProvider = "claude" | "gemini" | "openai";

export interface ApiGatewaySpec {
  readonly kind: "api";
  readonly provider: ApiProvider;
  readonly apiKey: string;
  readonly model: string;
}

/** CLI based providers — no API key, uses the tool's own auth. */
export interface CliGatewaySpec {
  readonly kind: "cli";
  readonly provider: string; // e.g. "claude-cli"
  readonly command: string;
  readonly args: string[];
  readonly modelFlag?: string;
  readonly model?: string;
  readonly promptVia: "arg" | "stdin";
}

export type LlmGatewaySpec = ApiGatewaySpec | CliGatewaySpec;

/** Builds the concrete LlmGateway for the selected spec. */
export function createLlmGateway(spec: LlmGatewaySpec): LlmGateway {
  if (spec.kind === "cli") {
    return new CliLlmGateway(spec.provider, {
      command: spec.command,
      args: spec.args,
      modelFlag: spec.modelFlag,
      model: spec.model,
      promptVia: spec.promptVia,
    });
  }

  if (!spec.apiKey) {
    throw new Error(`Missing API key for provider "${spec.provider}".`);
  }
  switch (spec.provider) {
    case "claude":
      return new AnthropicLlmGateway(spec.apiKey, spec.model);
    case "gemini":
      return new GeminiLlmGateway(spec.apiKey, spec.model);
    case "openai":
      return new OpenAiLlmGateway(spec.apiKey, spec.model);
  }
  throw new Error(`Unknown provider: ${(spec as ApiGatewaySpec).provider}`);
}
