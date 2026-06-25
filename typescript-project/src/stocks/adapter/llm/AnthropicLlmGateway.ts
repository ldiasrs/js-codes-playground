import { Prompt } from "../../domain/model/Prompt";
import { LlmGateway } from "../../application/port/LlmGateway";
import { postJson } from "./httpJson";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** Claude (Anthropic) adapter for the LlmGateway port. */
export class AnthropicLlmGateway implements LlmGateway {
  readonly name = "claude";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(prompt: Prompt): Promise<string> {
    const data = await postJson(
      ENDPOINT,
      {
        model: this.model,
        max_tokens: 1024,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      },
      {
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      "Anthropic",
    );

    return (data.content ?? [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("");
  }
}
