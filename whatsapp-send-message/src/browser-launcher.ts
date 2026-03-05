import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import { AppConfig } from "./config";

const CHROME_PATHS: Record<string, string[]> = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ],
  win32: [
    path.join(
      process.env.PROGRAMFILES ?? "C:\\Program Files",
      "Google\\Chrome\\Application\\chrome.exe"
    ),
    path.join(
      process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)",
      "Google\\Chrome\\Application\\chrome.exe"
    ),
  ],
};

const DEFAULT_PROFILE_DIR = "whatsapp-profile";

function getDefaultChromePath(): string | null {
  const candidates = CHROME_PATHS[process.platform];
  if (!candidates) return null;
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Resolves the Chrome profile directory. If not set in config, uses a default
 * inside the current working directory so the session is persisted.
 */
export function resolveUserDataDir(config: AppConfig): string {
  const raw = config.chrome.userDataDir;
  if (raw && raw.trim() !== "") {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  return path.resolve(process.cwd(), DEFAULT_PROFILE_DIR);
}

export interface LaunchResult {
  browser: Browser;
  page: Page;
}

/**
 * Launches Chrome with the config (executable, headless, userDataDir).
 * Uses a persistent profile by default so WhatsApp Web session is kept.
 */
export async function launchBrowser(config: AppConfig): Promise<LaunchResult> {
  const { chrome } = config;
  const userDataDir = resolveUserDataDir(config);

  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: chrome.headless,
    userDataDir,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  };

  const executablePath =
    chrome.executablePath && fs.existsSync(chrome.executablePath)
      ? chrome.executablePath
      : getDefaultChromePath();
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  } else {
    throw new Error(
      "Chrome/Chromium not found. Install Google Chrome or set config.chrome.executablePath to your browser path (e.g. on macOS: \"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome\")."
    );
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  return { browser, page };
}
