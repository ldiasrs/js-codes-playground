# WhatsApp Scheduled Message

Sends a WhatsApp message to a specific contact at a scheduled time by automating Chrome on WhatsApp Web. Designed for use with OS cron.

## Setup

1. **Install dependencies**

   ```bash
   cd typescript-project/data/whatsapp-send-message
   npm install
   ```

2. **Configure**

   Copy `config.example.json` to `config.json` (or edit the existing `config.json`) and set:

   - `contactNameOrNumber`: exact contact name as in WhatsApp or phone number (e.g. `+55 11 99999 9999`)
   - `message`: text to send
   - `sendAt`: optional ISO 8601 datetime (e.g. `2026-03-05T09:00:00.000Z`). If omitted, the message is sent as soon as the script runs.
   - `chrome.userDataDir`: optional path where the browser profile (and WhatsApp session) is stored. Defaults to `./whatsapp-profile` if not set. Use the same path for both login and send.
   - `chrome.headless`: set to `false` to see the browser (useful for first login or debugging).

3. **First run: log in and save session**

   The app uses a **persistent browser profile** so you only log in once:

   ```bash
   npm run build
   npm run login
   ```

   A Chrome window will open on WhatsApp Web. Scan the QR code with your phone (WhatsApp → Linked Devices). When you see your chats, go back to the terminal and press **Enter**. The session is saved in `./whatsapp-profile` (or the path in `config.chrome.userDataDir`). After that, `npm run send` will reuse this session and won’t ask for the QR again.

4. **Build**

   ```bash
   npm run build
   ```

## Scripts

| Script        | Description                                      |
|---------------|--------------------------------------------------|
| `npm run build`   | Compile TypeScript to `dist/`                   |
| `npm run login`   | Open WhatsApp Web and wait for you to scan QR (saves session for `send`) |
| `npm run login:ts` | Same as login, run with ts-node                 |
| `npm run send`    | Run the sender (uses `dist/`, for cron)         |
| `npm run send:ts`  | Run with ts-node without building               |
| `npm run cron:send` | Build then run (use when you want a fresh build in cron) |

## Debug mode

To trace what the script is doing and capture a screenshot on failure:

```bash
WHATSAPP_DEBUG=1 npm run send
```

- Logs are appended to `whatsapp-debug.log` (with timestamps).
- On any error, a full-page screenshot is saved as `whatsapp-debug-screenshot.png`.
- Extra log line: list of `[data-icon]` values found on the page (helps if the new chat button selector changes).

Check the log and screenshot to see how far the flow got and what the page looked like when it failed.

## Running from OS cron

Use the **absolute path** to the project and run the send script after the build is present.

**Option A – run pre-built (recommended)**

Ensure the project is built once (`npm run build`). Then in crontab run only the send script at the desired time, e.g. 9:00 every day:

```bash
0 9 * * * cd /Users/leonardodias/Documents/projects/js-codes-playground/typescript-project/data/whatsapp-send-message && /usr/local/bin/npm run send >> /tmp/whatsapp-send.log 2>&1
```

Replace the path and `npm` path with your real paths (`which npm`).

**Option B – build and run every time**

```bash
0 9 * * * cd /Users/leonardodias/Documents/projects/js-codes-playground/typescript-project/data/whatsapp-send-message && /usr/local/bin/npm run cron:send >> /tmp/whatsapp-send.log 2>&1
```

**Scheduling behaviour**

- If **cron** runs at 9:00 and you want to send at 9:00: set `sendAt` to that time or leave it empty; the script sends when it runs.
- If you run the script **before** 9:00 and set `sendAt` to `2026-03-05T09:00:00.000Z`, the script waits until that time then sends.

**Headless + cron**

- For cron, use `chrome.headless: true` and a persistent `chrome.userDataDir` so the browser reuses the same WhatsApp session without a display.
- On Linux without a display, you may need a virtual display (e.g. `xvfb-run`) or run with a user that has a display/session.

## Project layout

```
whatsapp-send-message/
├── config.json          # Your config (edit contact, message, sendAt, chrome)
├── config.example.json  # Template
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts         # Entry: load config, optional wait until sendAt, run sender
│   ├── config.ts        # Load and validate config
│   ├── browser-launcher.ts # Chrome launch and persistent profile path
│   ├── constants.ts     # WhatsApp Web URL and selectors
│   ├── login.ts         # One-time QR login and session save
│   └── whatsapp-sender.ts # Browser automation (open WhatsApp, search contact, send)
└── dist/                # Compiled JS (after npm run build)
```

## Notes

- WhatsApp Web selectors can change after updates; if sending fails, check `src/constants.ts` and `src/whatsapp-sender.ts`.
- Keep `config.json` out of version control if it contains sensitive data, or use environment-specific config files.
