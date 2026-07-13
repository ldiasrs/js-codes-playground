export type RGB = { red: number; green: number; blue: number };

export interface SheetTheme {
  /** Tab color + header row background. */
  readonly header: RGB;
  /** Light tint of the same hue for zebra row banding. */
  readonly band: RGB;
}

export const WHITE: RGB = { red: 1, green: 1, blue: 1 };

const THEMES: Record<string, SheetTheme> = {
  Acoes: {
    header: { red: 0.16, green: 0.38, blue: 0.71 }, // blue
    band: { red: 0.89, green: 0.93, blue: 0.98 },
  },
  Stocks: {
    header: { red: 0.15, green: 0.55, blue: 0.3 }, // green
    band: { red: 0.88, green: 0.96, blue: 0.9 },
  },
  FundosImobiliarios: {
    header: { red: 0.85, green: 0.47, blue: 0.09 }, // orange
    band: { red: 0.99, green: 0.93, blue: 0.85 },
  },
  FundosInvestimento: {
    header: { red: 0.46, green: 0.28, blue: 0.64 }, // purple
    band: { red: 0.93, green: 0.9, blue: 0.97 },
  },
  TesouroDireto: {
    header: { red: 0.06, green: 0.52, blue: 0.53 }, // teal
    band: { red: 0.87, green: 0.95, blue: 0.95 },
  },
  ETF: {
    header: { red: 0.28, green: 0.23, blue: 0.7 }, // indigo
    band: { red: 0.91, green: 0.9, blue: 0.97 },
  },
  Criptomoedas: {
    header: { red: 0.85, green: 0.65, blue: 0.13 }, // amber
    band: { red: 0.99, green: 0.95, blue: 0.85 },
  },
  CDB: {
    header: { red: 0.75, green: 0.21, blue: 0.18 }, // red
    band: { red: 0.98, green: 0.89, blue: 0.88 },
  },
};

const FALLBACK: SheetTheme = {
  header: { red: 0.35, green: 0.35, blue: 0.35 }, // gray
  band: { red: 0.93, green: 0.93, blue: 0.93 },
};

export function themeFor(group: string): SheetTheme {
  return THEMES[group] ?? FALLBACK;
}
