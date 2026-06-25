/** The two markets this tool understands. */
export type Market = "US" | "BR";

export const marketCurrency = (market: Market): string =>
  market === "BR" ? "BRL" : "USD";

export const marketLabel = (market: Market): string =>
  market === "BR" ? "🇧🇷 BR" : "🇺🇸 US";
