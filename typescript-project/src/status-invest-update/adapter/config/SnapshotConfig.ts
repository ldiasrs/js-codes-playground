import { readFileSync } from "fs";
import path from "path";

export interface GoogleSheetCredentials {
  readonly spreadsheetId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

export interface SnapshotConfig {
  readonly credentials: GoogleSheetCredentials;
  /** Default snapshot folder, used when the CLI is given none. */
  readonly defaultSourceFolder?: string;
}

const CONFIG_PATH = path.join(__dirname, "../../../../config/global-config.prod.json");
const CONFIG_KEY = "update_invest_spread_sheet";

export function loadSnapshotConfig(configPath: string = CONFIG_PATH): SnapshotConfig {
  const section = JSON.parse(readFileSync(configPath, "utf8"))[CONFIG_KEY];
  if (!section?.spread_sheet_id || !section?.google_json_key) {
    throw new Error(`missing "${CONFIG_KEY}.spread_sheet_id" or ".google_json_key" in ${configPath}`);
  }
  return {
    credentials: {
      spreadsheetId: section.spread_sheet_id,
      clientEmail: section.google_json_key.client_email,
      privateKey: section.google_json_key.private_key,
    },
    defaultSourceFolder: section.snapshot_update?.source_folder,
  };
}
