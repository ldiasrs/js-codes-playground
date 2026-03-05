import { loadConfig } from "./config";
import { log } from "./logger";
import { WhatsAppSender } from "./whatsapp-sender";

async function waitUntil(sendAt: string): Promise<void> {
  const target = new Date(sendAt).getTime();
  const now = Date.now();
  if (target <= now) {
    return;
  }
  const waitMs = target - now;
  log.step(`Waiting ${Math.round(waitMs / 1000)}s until`, sendAt);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
}

async function main(): Promise<void> {
  log.step("Loading config");
  const config = loadConfig();
  log.step("Config loaded", `contact: ${config.contactNameOrNumber}`);

  if (config.sendAt) {
    await waitUntil(config.sendAt);
  }

  const sender = new WhatsAppSender(config);
  await sender.run();
  log.step("Message sent successfully.");
}

main().catch((err) => {
  log.error("Fatal", err);
  process.exit(1);
});
