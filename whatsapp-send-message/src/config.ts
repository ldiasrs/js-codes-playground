import * as fs from "fs";
import * as path from "path";

export interface ChromeConfig {
  headless: boolean;
  userDataDir: string | null;
  executablePath: string | null;
}

export interface TimeoutsConfig {
  pageLoadMs: number;
  hydrationDelayMs: number;
  searchResultMs: number;
  messageSendMs: number;
  afterTypeDelayMs: number;
  afterSendDelayMs: number;
}

export interface AppConfig {
  contactNameOrNumber: string;
  message: string;
  sendAt: string | null;
  chrome: ChromeConfig;
  timeouts: TimeoutsConfig;
}

const DEFAULT_TIMEOUTS: TimeoutsConfig = {
  pageLoadMs: 60_000,
  hydrationDelayMs: 10_000,
  searchResultMs: 10_000,
  messageSendMs: 5_000,
  afterTypeDelayMs: 1_200,
  afterSendDelayMs: 3_000,
};

const DEFAULT_CHROME: ChromeConfig = {
  headless: false,
  userDataDir: null,
  executablePath: null,
};

function resolveConfigPath(): string {
  const candidate = path.join(__dirname, "..", "config.json");
  if (fs.existsSync(candidate)) {
    return path.resolve(candidate);
  }
  const cwd = path.join(process.cwd(), "config.json");
  if (fs.existsSync(cwd)) {
    return path.resolve(cwd);
  }
  throw new Error(
    "config.json not found. Copy config.example.json to config.json and edit it."
  );
}

function parseConfig(raw: unknown): AppConfig {
  if (raw === null || typeof raw !== "object") {
    throw new Error("config.json must be a JSON object");
  }

  const o = raw as Record<string, unknown>;

  const contactNameOrNumber = o.contactNameOrNumber;
  if (typeof contactNameOrNumber !== "string" || contactNameOrNumber.trim() === "") {
    throw new Error("config.contactNameOrNumber must be a non-empty string");
  }

  const message = o.message;
  if (typeof message !== "string") {
    throw new Error("config.message must be a string");
  }

  const sendAt = o.sendAt;
  const sendAtStr =
    sendAt === null || sendAt === undefined ? null : String(sendAt);

  const chromeRaw = o.chrome;
  let chrome: ChromeConfig = { ...DEFAULT_CHROME };
  if (chromeRaw !== null && typeof chromeRaw === "object") {
    const c = chromeRaw as Record<string, unknown>;
    chrome = {
      headless: typeof c.headless === "boolean" ? c.headless : DEFAULT_CHROME.headless,
      userDataDir:
        c.userDataDir === null || c.userDataDir === undefined
          ? null
          : String(c.userDataDir),
      executablePath:
        c.executablePath === null || c.executablePath === undefined
          ? null
          : String(c.executablePath),
    };
  }

  const timeoutsRaw = o.timeouts;
  let timeouts: TimeoutsConfig = { ...DEFAULT_TIMEOUTS };
  if (timeoutsRaw !== null && typeof timeoutsRaw === "object") {
    const t = timeoutsRaw as Record<string, unknown>;
    timeouts = {
      pageLoadMs:
        typeof t.pageLoadMs === "number" ? t.pageLoadMs : DEFAULT_TIMEOUTS.pageLoadMs,
      hydrationDelayMs:
        typeof t.hydrationDelayMs === "number"
          ? t.hydrationDelayMs
          : DEFAULT_TIMEOUTS.hydrationDelayMs,
      searchResultMs:
        typeof t.searchResultMs === "number"
          ? t.searchResultMs
          : DEFAULT_TIMEOUTS.searchResultMs,
      messageSendMs:
        typeof t.messageSendMs === "number"
          ? t.messageSendMs
          : DEFAULT_TIMEOUTS.messageSendMs,
      afterTypeDelayMs:
        typeof t.afterTypeDelayMs === "number"
          ? t.afterTypeDelayMs
          : DEFAULT_TIMEOUTS.afterTypeDelayMs,
      afterSendDelayMs:
        typeof t.afterSendDelayMs === "number"
          ? t.afterSendDelayMs
          : DEFAULT_TIMEOUTS.afterSendDelayMs,
    };
  }

  return {
    contactNameOrNumber: contactNameOrNumber.trim(),
    message,
    sendAt: sendAtStr,
    chrome,
    timeouts,
  };
}

export function loadConfig(): AppConfig {
  const configPath = resolveConfigPath();
  const content = fs.readFileSync(configPath, "utf-8");
  const raw: unknown = JSON.parse(content);
  return parseConfig(raw);
}
