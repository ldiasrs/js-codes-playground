import * as fs from "fs";
import { ApiProvider, LlmGatewaySpec } from "../llm/LlmGatewayFactory";

interface ProviderConfig {
  // API providers
  api_key?: string;
  model?: string;
  // CLI providers
  command?: string;
  args?: string[];
  model_flag?: string;
  prompt_via?: "arg" | "stdin";
}

interface StockAnalysisSection {
  default_provider?: string;
  providers?: Record<string, ProviderConfig>;
}

type Mode = "api" | "cli";

interface ProviderDefault {
  mode: Mode;
  model?: string;
  // api
  keyEnv?: string;
  // cli
  command?: string;
  args?: string[];
  modelFlag?: string;
  promptVia?: "arg" | "stdin";
}

/**
 * Built-in defaults per provider. CLI providers ("*-cli") need no API key — they
 * shell out to a locally-authenticated tool. The default is claude-cli (keyless).
 */
const PROVIDER_DEFAULTS: Record<string, ProviderDefault> = {
  claude: { mode: "api", model: "claude-opus-4-8", keyEnv: "ANTHROPIC_API_KEY" },
  gemini: { mode: "api", model: "gemini-2.5-flash", keyEnv: "GEMINI_API_KEY" },
  openai: { mode: "api", model: "gpt-4o-mini", keyEnv: "OPENAI_API_KEY" },
  "claude-cli": { mode: "cli", command: "claude", args: ["-p"], modelFlag: "--model", promptVia: "arg", model: "" },
  "gemini-cli": { mode: "cli", command: "gemini", args: ["-p"], modelFlag: "-m", promptVia: "arg", model: "" },
};

const DEFAULT_PROVIDER = "claude-cli";
const PLACEHOLDER = /^your-.*-here$/;

export interface ResolvedConfig {
  readonly spec: LlmGatewaySpec;
  /** Model label for logs/report (CLI default shown when no model pinned). */
  readonly displayModel: string;
  readonly concurrency: number;
}

/**
 * Resolves the LLM gateway spec + concurrency from config + environment.
 * Precedence: env override > config file > built-in default.
 */
export class StockAnalysisConfig {
  constructor(
    private readonly configFile: string,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  resolve(): ResolvedConfig {
    const section = this.readSection();
    const provider = (this.env.STOCKS_PROVIDER || section.default_provider || DEFAULT_PROVIDER)
      .trim()
      .toLowerCase();

    const def = PROVIDER_DEFAULTS[provider];
    if (!def) {
      throw new Error(
        `Unknown provider "${provider}". Use one of: ${Object.keys(PROVIDER_DEFAULTS).join(", ")}.`,
      );
    }

    const cfg = section.providers?.[provider] ?? {};
    const concurrency = Number(this.env.STOCKS_CONCURRENCY || 4);

    return def.mode === "cli"
      ? this.resolveCli(provider, cfg, def, concurrency)
      : this.resolveApi(provider, cfg, def, concurrency);
  }

  private resolveCli(
    provider: string,
    cfg: ProviderConfig,
    def: ProviderDefault,
    concurrency: number,
  ): ResolvedConfig {
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
    return { spec, displayModel: model || `${command} (cli default)`, concurrency };
  }

  private resolveApi(
    provider: string,
    cfg: ProviderConfig,
    def: ProviderDefault,
    concurrency: number,
  ): ResolvedConfig {
    const model = this.env.STOCKS_MODEL || this.clean(cfg.model) || def.model!;
    const apiKey = (def.keyEnv ? this.env[def.keyEnv] : "") || this.clean(cfg.api_key) || "";
    const spec: LlmGatewaySpec = {
      kind: "api",
      provider: provider as ApiProvider,
      apiKey,
      model,
    };
    return { spec, displayModel: model, concurrency };
  }

  private readSection(): StockAnalysisSection {
    try {
      const cfg = JSON.parse(fs.readFileSync(this.configFile, "utf8"));
      return (cfg.stock_analysis as StockAnalysisSection) ?? {};
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
