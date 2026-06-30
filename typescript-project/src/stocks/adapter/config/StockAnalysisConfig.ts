import * as fs from "fs";
import { FIELD_DEFINITIONS, FieldKey } from "../../domain/model/FieldDefinition";
import { Market } from "../../domain/model/Market";
import { DEFAULT_PILLAR_WEIGHTS, PillarWeights } from "../../domain/service/StockRanker";
import { ApiProvider, LlmGatewaySpec } from "../llm/LlmGatewayFactory";

interface ProviderConfig {
  api_key?: string;
  model?: string;
  token?: string; // brapi
  cookie?: string; // statusinvest
  command?: string; // cli
  args?: string[];
  model_flag?: string;
  prompt_via?: "arg" | "stdin";
}

interface StockAnalysisSection {
  default_source?: string;
  default_provider?: string; // legacy fallback
  sources_by_market?: Partial<Record<Market, string>>;
  fetch_enabled?: boolean;
  sheet_export?: boolean;
  fss_weights?: Partial<PillarWeights>;
  scored_fields?: Partial<Record<FieldKey, boolean>>;
  providers?: Record<string, ProviderConfig>;
}

export interface GoogleSheetConfig {
  readonly spreadsheetId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

type Mode = "api" | "cli";

interface ProviderDefault {
  mode: Mode;
  model?: string;
  keyEnv?: string; // api
  command?: string; // cli
  args?: string[];
  modelFlag?: string;
  promptVia?: "arg" | "stdin";
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefault> = {
  claude: { mode: "api", model: "claude-opus-4-8", keyEnv: "ANTHROPIC_API_KEY" },
  gemini: { mode: "api", model: "gemini-2.5-flash", keyEnv: "GEMINI_API_KEY" },
  openai: { mode: "api", model: "gpt-4o-mini", keyEnv: "OPENAI_API_KEY" },
  "claude-cli": { mode: "cli", command: "claude", args: ["-p"], modelFlag: "--model", promptVia: "arg", model: "" },
  "gemini-cli": { mode: "cli", command: "gemini", args: ["-p"], modelFlag: "-m", promptVia: "arg", model: "" },
};

/** Non-LLM data sources (no provider entry needed). */
const DATA_SOURCES = ["api", "statusinvest", "fundamentus", "brapi", "fmp"];
const DEFAULT_SOURCE = "api";
const TRUTHY = /^(1|true|yes|on)$/i;
const PLACEHOLDER = /^your-.*-here$/;

export interface LlmSource {
  spec: LlmGatewaySpec;
  displayModel: string;
}

/**
 * Resolves which source to use per market plus all credentials.
 * Per-market precedence (highest first):
 *   env STOCKS_SOURCE_<MKT> → sources_by_market.<MKT> → env STOCKS_SOURCE →
 *   default_source → built-in default ("api").
 */
export class StockAnalysisConfig {
  private readonly raw: any;
  private readonly section: StockAnalysisSection;
  readonly concurrency: number;

  constructor(
    configFile: string,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {
    this.raw = StockAnalysisConfig.readFile(configFile);
    this.section = this.raw.stock_analysis ?? {};
    this.concurrency = Number(env.STOCKS_CONCURRENCY || 4);
  }

  /** Whether to also export to Google Sheets. Enable with STOCKS_SHEET=1 or sheet_export. */
  sheetExportEnabled(): boolean {
    if (this.env.STOCKS_SHEET !== undefined) return TRUTHY.test(this.env.STOCKS_SHEET);
    return this.section.sheet_export === true;
  }

  /** Google Sheets doc + service-account auth, reused from `update_invest_spread_sheet`. */
  googleSheetConfig(): GoogleSheetConfig {
    const s = this.raw.update_invest_spread_sheet ?? {};
    const key = s.google_json_key ?? {};
    return {
      spreadsheetId: s.spread_sheet_id ?? "",
      clientEmail: key.client_email ?? "",
      privateKey: key.private_key ?? "",
    };
  }

  /** The source name configured for a given market. */
  sourceForMarket(market: Market): string {
    const perMarketEnv = market === "BR" ? this.env.STOCKS_SOURCE_BR : this.env.STOCKS_SOURCE_US;
    const source =
      perMarketEnv ||
      this.section.sources_by_market?.[market] ||
      this.env.STOCKS_SOURCE ||
      this.env.STOCKS_PROVIDER ||
      this.section.default_source ||
      this.section.default_provider ||
      DEFAULT_SOURCE;
    return source.trim().toLowerCase();
  }

  brapiToken(): string {
    return this.env.BRAPI_TOKEN || this.clean(this.section.providers?.brapi?.token) || "";
  }

  fmpKey(): string {
    return this.env.FMP_API_KEY || this.clean(this.section.providers?.fmp?.api_key) || "";
  }

  statusInvestCookie(): string {
    return this.env.STATUSINVEST_COOKIE || this.clean(this.section.providers?.statusinvest?.cookie) || "";
  }

  /** Whether to hit data sources. Default OFF (cache-only). Enable with STOCKS_FETCH=1. */
  fetchEnabled(): boolean {
    if (this.env.STOCKS_FETCH !== undefined) return TRUTHY.test(this.env.STOCKS_FETCH);
    return this.section.fetch_enabled === true;
  }

  /** Which fields feed the score: per-field `scored_fields` overrides the FIELD_DEFINITIONS default. */
  scoredFields(): FieldKey[] {
    const overrides = this.section.scored_fields ?? {};
    return FIELD_DEFINITIONS.filter((d) =>
      typeof overrides[d.key] === "boolean" ? (overrides[d.key] as boolean) : d.scored,
    ).map((d) => d.key);
  }

  /** Configured FSS pillar weights, each falling back to the built-in default. */
  pillarWeights(): PillarWeights {
    const w = this.section.fss_weights ?? {};
    const pick = (k: keyof PillarWeights) =>
      typeof w[k] === "number" ? (w[k] as number) : DEFAULT_PILLAR_WEIGHTS[k];
    return {
      profitability: pick("profitability"),
      debt: pick("debt"),
      valuation: pick("valuation"),
      growth: pick("growth"),
      efficiency: pick("efficiency"),
    };
  }

  /** Resolves an LLM provider source name to a gateway spec + display model. */
  llmSource(source: string): LlmSource {
    const def = PROVIDER_DEFAULTS[source];
    if (!def) {
      throw new Error(`Unknown source "${source}". Use one of: ${this.validSources().join(", ")}.`);
    }
    const cfg = this.section.providers?.[source] ?? {};
    return def.mode === "cli" ? this.cliSource(source, cfg, def) : this.apiSource(source, cfg, def);
  }

  validSources(): string[] {
    return [...DATA_SOURCES, ...Object.keys(PROVIDER_DEFAULTS)];
  }

  private cliSource(provider: string, cfg: ProviderConfig, def: ProviderDefault): LlmSource {
    const model = this.env.STOCKS_MODEL || this.clean(cfg.model) || def.model || "";
    const command = cfg.command || def.command!;
    const spec: LlmGatewaySpec = {
      kind: "cli",
      provider,
      command,
      args: cfg.args ?? def.args ?? [],
      modelFlag: cfg.model_flag || def.modelFlag,
      model,
      promptVia: cfg.prompt_via || def.promptVia || "arg",
    };
    return { spec, displayModel: model || `${command} (cli default)` };
  }

  private apiSource(provider: string, cfg: ProviderConfig, def: ProviderDefault): LlmSource {
    const model = this.env.STOCKS_MODEL || this.clean(cfg.model) || def.model!;
    const apiKey = (def.keyEnv ? this.env[def.keyEnv] : "") || this.clean(cfg.api_key) || "";
    const spec: LlmGatewaySpec = { kind: "api", provider: provider as ApiProvider, apiKey, model };
    return { spec, displayModel: model };
  }

  private static readFile(configFile: string): any {
    try {
      return JSON.parse(fs.readFileSync(configFile, "utf8"));
    } catch {
      return {};
    }
  }

  /** Drops empty strings and sample placeholders like "your-...-here". */
  private clean(value: string | undefined): string | undefined {
    if (!value || PLACEHOLDER.test(value)) return undefined;
    return value;
  }
}
