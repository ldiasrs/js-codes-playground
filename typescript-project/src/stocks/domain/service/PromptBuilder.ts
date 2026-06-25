import { Prompt } from "../model/Prompt";
import { Stock } from "../model/Stock";

/**
 * Turns the analyst system prompt (loaded from stock-analysis-prompt.md, which
 * holds the role, the field index with all threshold values, and the JSON output
 * contract) plus one ticker into a provider-agnostic {system, user} pair. Pure —
 * no IO; the markdown is injected by the caller.
 */
export class PromptBuilder {
  constructor(private readonly systemPrompt: string) {}

  build(stock: Stock): Prompt {
    const marketHint = stock.market === "BR" ? "B3 / BRL" : "US / USD";
    const user =
      "Analyze this single ticker and respond with ONLY the JSON object " +
      "described in your instructions — no markdown, no commentary.\n" +
      `TICKER: ${stock.ticker}\nMARKET: ${stock.market} (${marketHint})`;
    return { system: this.systemPrompt, user };
  }
}
