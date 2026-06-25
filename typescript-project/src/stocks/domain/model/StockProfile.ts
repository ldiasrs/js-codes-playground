/** Investment profiles a stock can fall into (a stock may have several). */
export type StockProfile = "solid" | "growth" | "dividend";

const PROFILES: readonly StockProfile[] = ["solid", "growth", "dividend"];

const PROFILE_LABELS: Record<StockProfile, string> = {
  solid: "🛡️ Solid",
  growth: "📈 Growth",
  dividend: "💰 Dividend",
};

export const profileLabel = (profile: StockProfile): string => PROFILE_LABELS[profile];

export function normalizeProfiles(value: unknown): StockProfile[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => String(p).toLowerCase())
    .filter((p): p is StockProfile => (PROFILES as string[]).includes(p));
}
