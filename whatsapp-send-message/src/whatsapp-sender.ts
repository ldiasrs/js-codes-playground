import { Browser, Page } from "puppeteer";
import { AppConfig } from "./config";
import { launchBrowser } from "./browser-launcher";
import { WHATSAPP_WEB_URL, SELECTORS, NEW_CHAT_SELECTORS, SEND_BUTTON_SELECTORS } from "./constants";
import { log, getDebugScreenshotPath, isDebugMode } from "./logger";

const DELAY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function searchInputSelector(): string {
  return `${SELECTORS.SEARCH_INPUT}, ${SELECTORS.SEARCH_ARIA}`;
}

function messageInputSelector(): string {
  return `${SELECTORS.MESSAGE_INPUT}, ${SELECTORS.MESSAGE_ARIA}`;
}

export class WhatsAppSender {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(private readonly config: AppConfig) {}

  async run(): Promise<void> {
    log.step("Starting send flow");
    await this.launchBrowser();
    try {
      await this.openWhatsApp();
      await this.searchAndSelectContact();
      await this.sendMessage();
    } catch (err) {
      if (isDebugMode() && this.page) {
        const screenshotPath = getDebugScreenshotPath();
        try {
          await this.page.screenshot({ path: screenshotPath, fullPage: true });
          log.step("Debug screenshot saved", screenshotPath);
        } catch (e) {
          log.error("Failed to save screenshot", e);
        }
      }
      throw err;
    } finally {
      await this.close();
    }
  }

  private async launchBrowser(): Promise<void> {
    log.step("Launching browser", `(headless: ${this.config.chrome.headless})`);
    const result = await launchBrowser(this.config);
    this.browser = result.browser;
    this.page = result.page;
    log.step("Browser ready");
  }

  private async openWhatsApp(): Promise<void> {
    if (!this.page) throw new Error("Browser page not initialized");

    log.step("Navigating to WhatsApp Web", WHATSAPP_WEB_URL);
    await this.page.goto(WHATSAPP_WEB_URL, {
      waitUntil: "networkidle2",
      timeout: this.config.timeouts.pageLoadMs,
    });
    log.step("Page loaded, waiting for UI to hydrate");

    const hydrationMs = this.config.timeouts.hydrationDelayMs;
    await delay(hydrationMs);
    log.step(`Hydration wait done (${hydrationMs}ms), looking for new chat button`);

    if (isDebugMode() && this.page) {
      const dataIcons = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-icon]"))
          .map((el) => el.getAttribute("data-icon"))
          .filter(Boolean)
      );
      log.step("Page [data-icon] values (for selector debug)", String(dataIcons));
    }

    const waitTimeout = Math.max(15000, this.config.timeouts.pageLoadMs - hydrationMs);
    let found = false;
    let foundSelector: string | null = null;
    for (const sel of NEW_CHAT_SELECTORS) {
      try {
        await this.page.waitForSelector(sel, { timeout: Math.min(15000, waitTimeout) });
        found = true;
        foundSelector = sel;
        break;
      } catch {
        continue;
      }
    }
    if (!found) {
      log.step("No fallback selector matched, waiting for primary selector", NEW_CHAT_SELECTORS[0]);
      await this.page.waitForSelector(NEW_CHAT_SELECTORS[0], { timeout: waitTimeout });
      foundSelector = NEW_CHAT_SELECTORS[0];
    }
    log.step("New chat button found", foundSelector ?? "primary");
    await delay(1500);
  }

  private async findNewChatButton(): Promise<Awaited<ReturnType<Page["$"]>>> {
    if (!this.page) return null;
    for (const sel of NEW_CHAT_SELECTORS) {
      const el = await this.page.$(sel);
      if (el) return el;
    }
    return null;
  }

  private async searchAndSelectContact(): Promise<void> {
    if (!this.page) throw new Error("Browser page not initialized");

    log.step("Looking for new chat button to open search");
    const newChat = await this.findNewChatButton();
    if (!newChat) {
      throw new Error(
        "New chat button not found. Ensure WhatsApp Web is loaded and you are logged in."
      );
    }
    await newChat.click();
    log.step("Clicked new chat, waiting for search input");
    await delay(1500);

    const searchSelector = searchInputSelector();
    const searchBox = await this.page.$(searchSelector);
    if (!searchBox) {
      throw new Error(
        `Search input not found (selector: ${searchSelector}). WhatsApp Web layout may have changed.`
      );
    }

    await searchBox.click();
    await delay(DELAY_MS);
    log.step("Typing contact", this.config.contactNameOrNumber);
    await this.page.keyboard.type(this.config.contactNameOrNumber, {
      delay: 50,
    });
    await delay(this.config.timeouts.searchResultMs);

    const contactSelector = `span[title="${this.config.contactNameOrNumber}"]`;
    const contact = await this.page.$(contactSelector);
    if (!contact) {
      const altSelector = `span[title*="${this.config.contactNameOrNumber.split(" ")[0]}"]`;
      log.step("Exact title not found, trying fallback", altSelector);
      const altContact = await this.page.$(altSelector);
      if (!altContact) {
        throw new Error(
          `Contact "${this.config.contactNameOrNumber}" not found. Check the name in config.json.`
        );
      }
      await altContact.click();
      log.step("Clicked contact (fallback match)");
    } else {
      await contact.click();
      log.step("Clicked contact (exact match)");
    }
    await delay(1500);
  }

  private async sendMessage(): Promise<void> {
    if (!this.page) throw new Error("Browser page not initialized");

    log.step("Waiting for message input");
    const msgSelector = messageInputSelector();
    const messageBox = await this.page.waitForSelector(msgSelector, {
      timeout: this.config.timeouts.messageSendMs,
    });
    if (!messageBox) {
      throw new Error(
        `Message input not found (selector: ${msgSelector}). Chat may not have opened.`
      );
    }

    await messageBox.click();
    await delay(500);
    log.step("Typing message", `(${this.config.message.length} chars)`);
    await this.page.keyboard.type(this.config.message, { delay: 30 });
    await delay(this.config.timeouts.afterTypeDelayMs);

    let sent = false;
    for (const sel of SEND_BUTTON_SELECTORS) {
      const sendBtn = await this.page.$(sel);
      if (sendBtn) {
        log.step("Clicking send", `(selector: ${sel})`);
        await sendBtn.click();
        sent = true;
        break;
      }
    }
    if (!sent) {
      log.step("Send button not found, sending with Enter");
      await this.page.keyboard.press("Enter");
    }
    await delay(this.config.timeouts.afterSendDelayMs);
  }

  private async close(): Promise<void> {
    if (this.browser) {
      log.step("Closing browser");
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
