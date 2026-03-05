import * as readline from "readline";
import { loadConfig } from "./config";
import { launchBrowser, resolveUserDataDir } from "./browser-launcher";
import { WHATSAPP_WEB_URL } from "./constants";

function waitForEnter(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("Scan the QR code in the browser, then press Enter to close and save the session.\n", () => {
      rl.close();
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  const profileDir = resolveUserDataDir(config);

  console.log("Opening browser with profile:", profileDir);
  console.log("WhatsApp Web will open. Log in by scanning the QR code with your phone.\n");

  const { browser, page } = await launchBrowser({
    ...config,
    chrome: { ...config.chrome, headless: false },
  });

  try {
    await page.goto(WHATSAPP_WEB_URL, {
      waitUntil: "networkidle2",
      timeout: config.timeouts.pageLoadMs,
    });
    await waitForEnter();
  } finally {
    await browser.close();
  }

  console.log("Session saved. You can now run 'npm run send' and it will use this login.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
