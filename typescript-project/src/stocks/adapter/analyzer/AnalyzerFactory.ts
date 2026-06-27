import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { Market } from "../../domain/model/Market";
import { PromptBuilder } from "../../domain/service/PromptBuilder";
import { StockAnalysisConfig } from "../config/StockAnalysisConfig";
import { createLlmGateway } from "../llm/LlmGatewayFactory";
import { BrapiStockAnalyzer } from "./BrapiStockAnalyzer";
import { FmpStockAnalyzer } from "./FmpStockAnalyzer";
import { FundamentusStockAnalyzer } from "./FundamentusStockAnalyzer";
import { StatusInvestStockAnalyzer } from "./StatusInvestStockAnalyzer";
import { LlmStockAnalyzer } from "./LlmStockAnalyzer";

export interface BuiltAnalyzer {
  readonly analyzer: StockAnalyzer;
  readonly label: string;
}

/**
 * Builds the StockAnalyzer for a source name + market. `"api"` picks the market's
 * default data source (BR → Status Invest, US → FMP); any other name maps to a
 * specific data source or LLM provider.
 */
export class AnalyzerFactory {
  constructor(
    private readonly config: StockAnalysisConfig,
    private readonly basePrompt: string,
  ) {}

  create(source: string, market: Market): BuiltAnalyzer {
    switch (source) {
      case "api":
        return this.create(market === "BR" ? "statusinvest" : "fmp", market);
      case "statusinvest":
        return { analyzer: new StatusInvestStockAnalyzer(this.config.statusInvestCookie()), label: "statusinvest" };
      case "fundamentus":
        return { analyzer: new FundamentusStockAnalyzer(), label: "fundamentus" };
      case "brapi":
        return { analyzer: new BrapiStockAnalyzer(this.config.brapiToken()), label: "brapi" };
      case "fmp":
        return { analyzer: new FmpStockAnalyzer(this.config.fmpKey()), label: "fmp" };
      default: {
        const { spec, displayModel } = this.config.llmSource(source);
        const gateway = createLlmGateway(spec);
        const analyzer = new LlmStockAnalyzer(gateway, new PromptBuilder(this.basePrompt));
        return { analyzer, label: `${gateway.name}/${displayModel}` };
      }
    }
  }
}
