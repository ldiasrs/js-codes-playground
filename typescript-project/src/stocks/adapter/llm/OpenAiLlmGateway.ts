import { Prompt } from "../../domain/model/Prompt";
import { LlmGateway } from "../../application/port/LlmGateway";
import { postJson } from "./httpJson";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

/** OpenAI adapter for the LlmGateway port. */
export class OpenAiLlmGateway implements LlmGateway {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(prompt: Prompt): Promise<string> {
    const data = await postJson(
      ENDPOINT,
      {
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      },
      { Authorization: `Bearer ${this.apiKey}` },
      "OpenAI",
    );

    return data.choices?.[0]?.message?.content ?? "";
  }
}
