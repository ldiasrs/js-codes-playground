import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { LlmGateway } from "../../application/port/LlmGateway";
import { PromptBuilder } from "../../domain/service/PromptBuilder";
import { StockAnalysisParser } from "../../domain/service/StockAnalysisParser";
import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";

/**
 * AI source: builds the prompt, calls the chosen LLM gateway, and parses the
 * JSON answer into a StockAnalysis.
 */
export class LlmStockAnalyzer implements StockAnalyzer {
  private readonly parser = new StockAnalysisParser();

  constructor(
    private readonly gateway: LlmGateway,
    private readonly promptBuilder: PromptBuilder,
  ) {}

  get name(): string {
    return this.gateway.name;
  }

  async analyze(stock: Stock): Promise<StockAnalysis> {
    const raw = await this.gateway.complete(this.promptBuilder.build(stock));
    return this.parser.parse(raw, stock);
  }
}
