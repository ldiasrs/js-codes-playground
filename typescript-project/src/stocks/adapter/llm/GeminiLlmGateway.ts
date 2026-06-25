import { Prompt } from "../../domain/model/Prompt";
import { LlmGateway } from "../../application/port/LlmGateway";
import { postJson } from "./httpJson";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Google Gemini adapter for the LlmGateway port. */
export class GeminiLlmGateway implements LlmGateway {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(prompt: Prompt): Promise<string> {
    const url = `${BASE}/${encodeURIComponent(this.model)}:generateContent?key=${this.apiKey}`;
    const data = await postJson(
      url,
      {
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      },
      {},
      "Gemini",
    );

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p.text ?? "").join("");
  }
}
