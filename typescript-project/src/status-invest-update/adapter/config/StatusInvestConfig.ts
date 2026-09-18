import { readFileSync } from "fs";
import path from "path";

export interface GoogleSheetConfig {
  readonly spreadsheetId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

export interface SnapshotUpdateConfig {
  readonly enabled: boolean;
  readonly sourceFolder: string;
}

const DEFAULT_CONFIG_PATH = path.join(
  __dirname,
  "../../../../config/global-config.prod.json",
);

export function loadGoogleSheetConfig(
  configPath: string = DEFAULT_CONFIG_PATH,
): GoogleSheetConfig {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const sheetConfig = config.update_invest_spread_sheet;
  if (!sheetConfig?.spread_sheet_id || !sheetConfig?.google_json_key) {
    throw new Error(`missing "update_invest_spread_sheet" config in ${configPath}`);
  }
  return {
    spreadsheetId: sheetConfig.spread_sheet_id,
    clientEmail: sheetConfig.google_json_key.client_email,
    privateKey: sheetConfig.google_json_key.private_key,
  };
}

/** Loads the optional default snapshot-update settings from the shared sheet config. */
export function loadSnapshotUpdateConfig(
  configPath: string = DEFAULT_CONFIG_PATH,
): SnapshotUpdateConfig | undefined {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const snapshot = config.update_invest_spread_sheet?.snapshot_update;
  if (!snapshot) return undefined;
  if (typeof snapshot.enabled !== "boolean" || typeof snapshot.source_folder !== "string") {
    throw new Error(
      `invalid "snapshot_update" config in ${configPath}: expected enabled and source_folder`,
    );
  }
  return { enabled: snapshot.enabled, sourceFolder: snapshot.source_folder };
}
