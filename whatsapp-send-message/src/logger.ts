import * as fs from "fs";
import * as path from "path";

const PREFIX = "[whatsapp]";
const DEBUG_LOG_FILE = "whatsapp-debug.log";
const DEBUG_SCREENSHOT_FILE = "whatsapp-debug-screenshot.png";

function isDebug(): boolean {
  return process.env.WHATSAPP_DEBUG === "1" || process.env.WHATSAPP_DEBUG === "true";
}

function writeToFile(line: string): void {
  if (!isDebug()) return;
  const cwd = process.cwd();
  const filePath = path.join(cwd, DEBUG_LOG_FILE);
  try {
    fs.appendFileSync(filePath, `${new Date().toISOString()} ${line}\n`);
  } catch {
    // ignore
  }
}

function flushStdout(): void {
  if (process.stdout.write("")) {
    (process.stdout as NodeJS.WritableStream & { flush?: () => void }).flush?.();
  }
}

export const log = {
  step(message: string, detail?: string): void {
    const line = detail ? `${message} ${detail}` : message;
    const full = `${PREFIX} ${line}`;
    console.log(full);
    writeToFile(full);
    flushStdout();
  },
  error(message: string, err?: unknown): void {
    const msg =
      err instanceof Error ? `${message}: ${err.message}` : `${message} ${String(err)}`;
    console.error(`${PREFIX} ${msg}`);
    writeToFile(`ERROR ${msg}`);
    flushStdout();
  },
};

export function getDebugScreenshotPath(): string {
  return path.join(process.cwd(), DEBUG_SCREENSHOT_FILE);
}

export function isDebugMode(): boolean {
  return isDebug();
}
